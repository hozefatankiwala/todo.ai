"""Scheduler job functions. Must not perform DB mutations."""
import logging

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.push_subscription import PushSubscription
from app.models.task import Task
from app.services import push_service

logger = logging.getLogger(__name__)

_sync_engine = create_engine(settings.database_url.replace("+aiosqlite", ""))
_SyncSession = sessionmaker(_sync_engine)

OFFSET_LABELS = {
    15: "15 minutes",
    30: "30 minutes",
    60: "1 hour",
    1440: "1 day",
    2880: "2 days",
}


def _human_offset(minutes: int) -> str:
    return OFFSET_LABELS.get(minutes, f"{minutes} minute" if minutes == 1 else f"{minutes} minutes")


def send_notification(task_id: int, offset_minutes: int) -> None:
    """Fire a push notification for a task at the scheduled offset.

    Scheduler job functions. Must not perform DB mutations.
    """
    with _SyncSession() as session:
        task = session.get(Task, task_id)
        if task is None:
            logger.warning("send_notification: task %d not found, skipping", task_id)
            return
        if task.is_completed:
            logger.info("send_notification: task %d is completed, skipping", task_id)
            return

        subscriptions = session.execute(select(PushSubscription)).scalars().all()
        if not subscriptions:
            logger.info("send_notification: no push subscriptions found, skipping")
            return

        payload = {
            "title": task.name,
            "body": f"{task.name} — due in {_human_offset(offset_minutes)}",
            "task_id": str(task.id),
        }
        for sub in subscriptions:
            try:
                push_service.send_web_push(sub, payload)
            except Exception:
                logger.exception("send_notification: failed to push to endpoint %s", sub.endpoint)
