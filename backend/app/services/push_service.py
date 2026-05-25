import json
import logging

from pywebpush import WebPushException, webpush

from app.config import settings

logger = logging.getLogger(__name__)


def send_web_push(subscription, payload: dict) -> None:
    """Send a web push notification. Errors are logged, never re-raised."""
    if not (settings.vapid_private_key or "").strip():
        logger.warning("VAPID private key not configured — skipping push delivery")
        return

    subscription_info = {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.p256dh,
            "auth": subscription.auth,
        },
    }

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": f"mailto:{settings.vapid_claim_email}"},
            content_encoding="aes128gcm",
        )
    except WebPushException as e:
        logger.error("Push delivery failed (WebPushException): %s", e)
    except Exception as e:
        logger.error("Push delivery failed (unexpected): %s", e)
