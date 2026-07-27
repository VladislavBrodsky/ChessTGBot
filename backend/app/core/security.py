import hmac
import hashlib
import ipaddress
import json
import logging
import time
from collections.abc import Mapping
from urllib.parse import unquote, urlsplit
from fastapi import HTTPException
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Max age of a Telegram initData string before it is rejected as stale. Telegram
# signs an `auth_date` into every initData payload; without this check a captured
# initData string authenticates as its user forever (indefinite replay). 24h is a
# generous window that still bounds the value of a leaked string.
INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60
MAX_CLIENT_IP_HEADER_LENGTH = 128

# These are the only browser origins we operate. An arbitrary rejected Origin
# is expected internet noise, but rejecting one of our own app domains is a
# deployment/configuration failure that prevents API and Socket.IO access.
FIRST_PARTY_CORS_ORIGINS = frozenset({
    "https://web3chess.online",
    "https://www.web3chess.online",
})
CORS_REJECTION_ALERT_INTERVAL_SECONDS = 600.0
_first_party_cors_rejection_alerted_at: dict[str, float] = {}


def _normalise_ip(value: object) -> str | None:
    """Return a canonical IP address, rejecting non-IP and oversized values."""
    if not isinstance(value, str) or not value or len(value) > MAX_CLIENT_IP_HEADER_LENGTH:
        return None
    try:
        return str(ipaddress.ip_address(value.strip()))
    except ValueError:
        return None


def _trusted_proxy_networks() -> tuple[ipaddress.IPv4Network | ipaddress.IPv6Network, ...]:
    """Read the explicit proxy boundary; malformed configuration fails closed."""
    networks = []
    for cidr in settings.TRUSTED_PROXY_CIDRS.split(","):
        try:
            networks.append(ipaddress.ip_network(cidr.strip()))
        except ValueError:
            continue
    # Test servers are loopback-only. Requiring the Railway marker as well keeps
    # direct local requests untrusted while allowing realistic edge simulation.
    if settings.is_development_or_testing:
        networks.append(ipaddress.ip_network("127.0.0.0/8"))
        networks.append(ipaddress.ip_network("::1/128"))
    return tuple(networks)


def _is_trusted_railway_proxy(peer_ip: str, headers: Mapping[str, object]) -> bool:
    """Whether this peer is a Railway edge proxy allowed to supply X-Real-IP."""
    if not headers.get("x-railway-edge"):
        return False
    try:
        address = ipaddress.ip_address(peer_ip)
    except ValueError:
        return False
    return any(address in network for network in _trusted_proxy_networks())


def _extract_trusted_client_ip(peer: object, headers: Mapping[str, object]) -> str | None:
    """Resolve one client identity without ever trusting generic forwarded hops."""
    peer_ip = _normalise_ip(peer)
    if not peer_ip:
        return None

    if not _is_trusted_railway_proxy(peer_ip, headers):
        return peer_ip

    # Railway documents X-Real-IP as the original remote address. Do not use
    # X-Forwarded-For: a client-controlled first hop made rate-limit and Sybil
    # identities spoofable before SEC-02.
    return _normalise_ip(headers.get("x-real-ip"))


def extract_client_ip(environ: dict) -> str | None:
    """Resolve a Socket.IO client IP using the same trusted boundary as HTTP."""
    if not environ:
        return None
    peer = environ.get("REMOTE_ADDR")
    scope = environ.get("asgi.scope") or {}
    client = scope.get("client")
    if not peer and client and len(client) >= 1:
        peer = client[0]
    return _extract_trusted_client_ip(peer, {
        "x-real-ip": environ.get("HTTP_X_REAL_IP"),
        "x-railway-edge": environ.get("HTTP_X_RAILWAY_EDGE"),
    })


def extract_client_ip_from_request(request) -> str | None:
    """Resolve an HTTP client IP using the same trusted boundary as Socket.IO."""
    if request is None:
        return None
    try:
        peer = request.client.host if request.client else None
        return _extract_trusted_client_ip(peer, {
            "x-real-ip": request.headers.get("x-real-ip"),
            "x-railway-edge": request.headers.get("x-railway-edge"),
        })
    except Exception:
        return None


def hash_ip(ip: str | None) -> str | None:
    """
    Salted, one-way hash of a client IP for anti-collusion comparisons. We store
    only the hash (never the raw IP) in the transient matchmaking queue so two
    connections from the same network can be compared for equality without
    retaining PII. Salted with SECRET_KEY so hashes are not portable/enumerable.
    """
    if not ip:
        return None
    secret = getattr(settings, "SECRET_KEY", "") or ""
    return hashlib.sha256(f"{secret}:{ip}".encode("utf-8")).hexdigest()[:32]


def validate_init_data(init_data: str, max_age_seconds: int = INIT_DATA_MAX_AGE_SECONDS) -> dict:
    """
    Validates the Telegram WebApp initData string or Telegram Login Widget string using HMAC-SHA256
    and rejects stale payloads based on their signed `auth_date`.
    Returns the parsed user data dictionary if valid, raises HTTPException otherwise.
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=500, detail="Bot token not configured")

    if not init_data:
        raise HTTPException(status_code=401, detail="Missing initData")

    try:
        # Parse initData string into a dictionary
        data_dict = {}
        for part in init_data.split('&'):
            if '=' in part:
                key, value = part.split('=', 1)
                data_dict[key] = unquote(value)
        
        if 'hash' not in data_dict:
            raise HTTPException(status_code=401, detail="Missing hash in initData")

        received_hash = data_dict.pop('hash')

        # Determine payload type
        is_tma = 'query_id' in data_dict or 'user' in data_dict

        # Prepare payload for HMAC
        # Keys must be sorted alphabetically
        data_check_string = '\n'.join(f'{k}={v}' for k, v in sorted(data_dict.items()))

        if is_tma:
            # TMA Auth Signature
            secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        else:
            # Web Widget Auth Signature
            secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()

        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(calculated_hash, received_hash):
            raise HTTPException(status_code=403, detail="Invalid initData signature")

        # Reject stale payloads (replay protection). auth_date is a signed unix
        # timestamp; it is inside the HMAC so it cannot be forged, only replayed.
        if max_age_seconds is not None:
            auth_date_raw = data_dict.get('auth_date')
            if not auth_date_raw:
                raise HTTPException(status_code=401, detail="Missing auth_date in initData")
            try:
                auth_date = int(auth_date_raw)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail="Invalid auth_date in initData")
            age = time.time() - auth_date
            # Allow a small negative skew for clock differences between servers.
            if age > max_age_seconds or age < -300:
                raise HTTPException(status_code=401, detail="initData has expired, please reopen the app")

        if is_tma:
            # Extract user data from JSON 'user' string
            user_data_str = data_dict.get('user')
            if not user_data_str:
                 raise HTTPException(status_code=400, detail="Missing user data in initData")
            user_data = json.loads(user_data_str)
            if 'start_param' in data_dict:
                user_data['start_param'] = data_dict['start_param']
            return user_data
        else:
            # Web Widget data is flat, normalize it to match TMA format
            # Convert 'id' to int since it comes as string in query params
            user_id = data_dict.get('id')
            if not user_id:
                 raise HTTPException(status_code=400, detail="Missing id in widget data")
                 
            user_data = {
                'id': int(user_id),
                'first_name': data_dict.get('first_name', ''),
                'last_name': data_dict.get('last_name'),
                'username': data_dict.get('username'),
                'photo_url': data_dict.get('photo_url')
            }
            return user_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")


def parse_init_data_unverified(init_data: str) -> dict:
    """
    Parses Telegram WebApp initData string or Telegram Login Widget string without validating the signature.
    Useful for local dev testing with real Telegram accounts when bot token is not configured.
    """
    if not init_data:
        return {}
    try:
        data_dict = {}
        for part in init_data.split('&'):
            if '=' in part:
                key, value = part.split('=', 1)
                data_dict[key] = unquote(value)
        
        is_tma = 'query_id' in data_dict or 'user' in data_dict
        
        if is_tma:
            user_data_str = data_dict.get('user')
            if not user_data_str:
                return {}
            
            user_data = json.loads(user_data_str)
            if 'start_param' in data_dict:
                user_data['start_param'] = data_dict['start_param']
            return user_data
        else:
            user_id = data_dict.get('id')
            if not user_id:
                return {}
            return {
                'id': int(user_id),
                'first_name': data_dict.get('first_name', ''),
                'last_name': data_dict.get('last_name'),
                'username': data_dict.get('username'),
                'photo_url': data_dict.get('photo_url')
            }
    except Exception:
        return {}


def _normalise_cors_origin(value: object) -> str | None:
    """Return a canonical scheme/host/port origin, rejecting URL fragments."""
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = urlsplit(value)
        port = parsed.port
    except ValueError:
        return None

    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
        or parsed.path not in {"", "/"}
    ):
        return None

    host = parsed.hostname.lower().rstrip(".")
    if ":" in host:
        host = f"[{host}]"
    if port is None or (parsed.scheme == "https" and port == 443) or (parsed.scheme == "http" and port == 80):
        return f"{parsed.scheme}://{host}"
    return f"{parsed.scheme}://{host}:{port}"


def _configured_cors_origins() -> set[str]:
    """Read only exact origins from deployment configuration."""
    configured = [
        *settings.CORS_ALLOWED_ORIGINS.split(","),
        settings.WEBAPP_URL,
        settings.BACKEND_URL,
    ]
    return {
        origin
        for value in configured
        if (origin := _normalise_cors_origin(value.strip() if isinstance(value, str) else value))
    }


def clear_first_party_cors_rejection_alerts() -> None:
    """Reset the in-process CORS alert throttle (used by tests)."""
    _first_party_cors_rejection_alerted_at.clear()


def _alert_on_first_party_cors_rejection(origin: str) -> None:
    """Page once per known app origin when its CORS configuration breaks."""
    if origin not in FIRST_PARTY_CORS_ORIGINS:
        return
    now = time.monotonic()
    last_alerted_at = _first_party_cors_rejection_alerted_at.get(origin)
    if (
        last_alerted_at is not None
        and now - last_alerted_at < CORS_REJECTION_ALERT_INTERVAL_SECONDS
    ):
        return
    _first_party_cors_rejection_alerted_at[origin] = now
    logger.error(
        "First-party CORS origin rejected: %s; check CORS_ALLOWED_ORIGINS, WEBAPP_URL, and BACKEND_URL",
        origin,
    )


def is_allowed_cors_origin(origin: str | None) -> bool:
    """Allow exact configured origins and local origins only outside production."""
    normalised_origin = _normalise_cors_origin(origin)
    if not normalised_origin or normalised_origin != origin:
        return False

    parsed = urlsplit(normalised_origin)
    if parsed.hostname in {"localhost", "127.0.0.1", "::1"}:
        return settings.is_development_or_testing

    allowed = normalised_origin in _configured_cors_origins()
    if not allowed:
        _alert_on_first_party_cors_rejection(normalised_origin)
    return allowed


