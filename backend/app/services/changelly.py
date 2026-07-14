"""Minimal, backend-only Changelly Exchange API v2 client.

Changelly converts supported source assets to USDTON and pays the configured
TON wallet. This client never credits a user balance; the existing on-chain
USDT verifier remains the only settlement authority.
"""

from __future__ import annotations

import base64
import json
import secrets
from typing import Any

import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa


class ChangellyError(RuntimeError):
    def __init__(self, message: str, code: int | str | None = None):
        super().__init__(message)
        self.code = code


class ChangellyClient:
    def __init__(
        self,
        *,
        api_key: str,
        private_key_hex: str,
        base_url: str = "https://api.changelly.com/v2",
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.api_key = api_key.strip()
        self.private_key_hex = "".join(private_key_hex.split())
        self.base_url = base_url.rstrip("/")
        self.transport = transport

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.private_key_hex)

    def _sign(self, body: bytes) -> str:
        try:
            key_bytes = bytes.fromhex(self.private_key_hex)
            private_key = serialization.load_der_private_key(key_bytes, password=None)
        except (ValueError, TypeError) as exc:
            raise ChangellyError("Changelly private key is invalid") from exc
        if not isinstance(private_key, rsa.RSAPrivateKey):
            raise ChangellyError("Changelly private key must be an RSA PKCS#8 key")
        signature = private_key.sign(body, padding.PKCS1v15(), hashes.SHA256())
        return base64.b64encode(signature).decode("ascii")

    async def _call(self, method: str, params: dict[str, Any] | list[Any]) -> Any:
        if not self.configured:
            raise ChangellyError("Changelly is not configured")
        payload = {
            "jsonrpc": "2.0",
            "id": secrets.token_hex(8),
            "method": method,
            "params": params,
        }
        body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "X-Api-Key": self.api_key,
            "X-Api-Signature": self._sign(body),
        }
        try:
            async with httpx.AsyncClient(
                timeout=15.0, transport=self.transport
            ) as client:
                response = await client.post(self.base_url, content=body, headers=headers)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            raise ChangellyError(
                "Exchange provider rejected the request", exc.response.status_code
            ) from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise ChangellyError("Exchange provider is temporarily unavailable") from exc

        error = data.get("error") if isinstance(data, dict) else None
        if error:
            raise ChangellyError(
                str(error.get("message") or "Exchange provider error"), error.get("code")
            )
        if not isinstance(data, dict) or "result" not in data:
            raise ChangellyError("Exchange provider returned an invalid response")
        return data["result"]

    async def fixed_quote(self, source: str, destination: str, amount: str) -> dict[str, Any]:
        result = await self._call(
            "getFixRateForAmount",
            [{"from": source, "to": destination, "amountFrom": amount}],
        )
        if not isinstance(result, list) or not result:
            raise ChangellyError("This exchange pair is currently unavailable")
        return result[0]

    async def create_fixed_order(
        self,
        *,
        source: str,
        destination: str,
        amount: str,
        rate_id: str,
        payout_address: str,
        payout_extra_id: str,
        refund_address: str,
    ) -> dict[str, Any]:
        return await self._call(
            "createFixTransaction",
            {
                "from": source,
                "to": destination,
                "amountFrom": amount,
                "rateId": rate_id,
                "address": payout_address,
                "extraId": payout_extra_id,
                "refundAddress": refund_address,
            },
        )

    async def transaction(self, order_id: str) -> dict[str, Any] | None:
        result = await self._call("getTransactions", {"id": order_id, "limit": 1})
        if not isinstance(result, list) or not result:
            return None
        return result[0]
