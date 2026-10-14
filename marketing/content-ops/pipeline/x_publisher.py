"""Live X (Twitter) API Publisher using OAuth 1.0a User Context.

Posts single tweets, threaded sequences, and docked replies to @defi_ambassador
using the official X API v2 (https://api.x.com/2/tweets).
"""
from __future__ import annotations

import os
import json
import time
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests
from requests_oauthlib import OAuth1

logger = logging.getLogger(__name__)

# Load local marketing .env if present
ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = ROOT / "marketing/.env"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

TWEETS_ENDPOINT = "https://api.x.com/2/tweets"
USERS_ME_ENDPOINT = "https://api.x.com/2/users/me"
MEDIA_UPLOAD_ENDPOINT = "https://upload.twitter.com/1.1/media/upload.json"


def get_oauth1_auth() -> OAuth1:
    """Returns an OAuth1 session handler configured from environment variables."""
    ck = os.getenv("X_CONSUMER_KEY")
    cs = os.getenv("X_CONSUMER_SECRET")
    at = os.getenv("X_ACCESS_TOKEN")
    ats = os.getenv("X_ACCESS_TOKEN_SECRET")

    if not all([ck, cs, at, ats]):
        raise ValueError(
            "Missing X API OAuth 1.0a credentials in environment. "
            "Ensure X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, "
            "and X_ACCESS_TOKEN_SECRET are set."
        )

    return OAuth1(ck, cs, at, ats)


def verify_credentials() -> Dict[str, Any]:
    """Tests the credentials by fetching current authenticated user profile."""
    auth = get_oauth1_auth()
    resp = requests.get(USERS_ME_ENDPOINT, auth=auth, timeout=10)
    resp.raise_for_status()
    return resp.json()


def upload_media(image_path: str | Path) -> str:
    """Uploads an image (PNG/JPEG) to X using OAuth 1.0a media upload endpoint.

    Args:
        image_path: Relative or absolute path to the image file.

    Returns:
        media_id_string: The X media ID string for attaching to tweets.
    """
    path = Path(image_path)
    if not path.is_absolute():
        path = ROOT / path
    if not path.exists():
        raise FileNotFoundError(f"Media file not found: {path}")

    auth = get_oauth1_auth()
    with open(path, "rb") as f:
        files = {"media": f}
        resp = requests.post(MEDIA_UPLOAD_ENDPOINT, auth=auth, files=files, timeout=30)

    if not resp.ok:
        logger.error(f"X Media Upload error: status={resp.status_code}, body={resp.text}")
        resp.raise_for_status()

    return resp.json()["media_id_string"]


def post_tweet(
    text: str,
    reply_to_id: Optional[str] = None,
    media_ids: Optional[List[str]] = None,
    image_path: Optional[str | Path] = None,
) -> Dict[str, Any]:
    """Posts a single tweet to X via API v2.
    
    Args:
        text: The text content of the tweet (max 280 characters).
        reply_to_id: Optional tweet ID to reply to (for threads/docked replies).
        media_ids: Optional list of media IDs to attach.
        image_path: Optional path to local image to upload and attach.
        
    Returns:
        The JSON response from X API containing the new tweet ID.
    """
    auth = get_oauth1_auth()
    payload: Dict[str, Any] = {"text": text}

    if image_path and not media_ids:
        mid = upload_media(image_path)
        media_ids = [mid]

    if reply_to_id:
        payload["reply"] = {"in_reply_to_tweet_id": str(reply_to_id)}

    if media_ids:
        payload["media"] = {"media_ids": [str(m) for m in media_ids]}

    resp = requests.post(
        TWEETS_ENDPOINT,
        auth=auth,
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    
    if not resp.ok:
        logger.error(f"X API error: status={resp.status_code}, body={resp.text}")
        resp.raise_for_status()

    return resp.json()


def post_tweet_with_docked_reply(
    root_text: str,
    reply_text: str,
    image_path: Optional[str | Path] = None,
) -> Dict[str, Any]:
    """Posts a root tweet (with optional attached image) followed immediately by a docked reply."""
    root_res = post_tweet(root_text, image_path=image_path)
    root_id = root_res["data"]["id"]

    reply_res = post_tweet(reply_text, reply_to_id=root_id)
    reply_id = reply_res["data"]["id"]

    return {
        "success": True,
        "root_id": root_id,
        "reply_id": reply_id,
        "root_url": f"https://x.com/defi_ambassador/status/{root_id}",
    }


class ThreadPublishError(RuntimeError):
    """Raised when a thread publication fails midway, preserving already published IDs."""
    def __init__(self, message: str, published_ids: List[str]):
        super().__init__(message)
        self.published_ids = published_ids


def post_thread(
    tweets: List[str],
    image_path: Optional[str | Path] = None,
    attach_to: str = "first",
    existing_ids: Optional[List[str]] = None,
    delay_seconds: float = 2.5,
) -> Dict[str, Any]:
    """Publishes a chained thread of tweets in sequence with optional image attachment and resumption."""
    if not tweets:
        raise ValueError("Thread must contain at least 1 tweet.")

    published_ids: List[str] = list(existing_ids or [])
    parent_id: Optional[str] = published_ids[-1] if published_ids else None
    uploaded_media_id: Optional[str] = None

    if image_path:
        uploaded_media_id = upload_media(image_path)

    start_idx = len(published_ids)
    for idx in range(start_idx, len(tweets)):
        text = tweets[idx]
        media_ids = None

        # Determine if image should be attached to this tweet
        if uploaded_media_id:
            if attach_to == "first" and idx == 0:
                media_ids = [uploaded_media_id]
            elif attach_to == "last" and idx == len(tweets) - 1:
                media_ids = [uploaded_media_id]

        if idx > 0 and delay_seconds > 0:
            time.sleep(delay_seconds)

        try:
            res = post_tweet(text, reply_to_id=parent_id, media_ids=media_ids)
            tweet_id = res["data"]["id"]
            published_ids.append(tweet_id)
            parent_id = tweet_id
        except Exception as err:
            logger.error(f"Thread publication halted at tweet {idx+1}/{len(tweets)}: {err}")
            raise ThreadPublishError(
                f"Thread failed at tweet {idx+1}/{len(tweets)}: {err}",
                published_ids=published_ids,
            ) from err

    root_id = published_ids[0]
    return {
        "success": True,
        "root_id": root_id,
        "all_ids": published_ids,
        "url": f"https://x.com/defi_ambassador/status/{root_id}",
    }


