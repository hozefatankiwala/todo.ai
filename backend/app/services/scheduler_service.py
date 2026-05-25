from datetime import timedelta

from app.scheduler.jobs import send_notification
from app.scheduler.setup import scheduler


def schedule_reminders(task) -> None:
    """Schedule one APScheduler job per offset for a task."""
    offsets = task.offsets or []
    for offset in offsets:
        fire_at = task.deadline_at - timedelta(minutes=offset)
        scheduler.add_job(
            send_notification,
            trigger="date",
            run_date=fire_at,
            args=[task.id, offset],
            id=f"reminder_{task.id}_{offset}",
            replace_existing=True,
            misfire_grace_time=120,
        )


def cancel_task_jobs(task_id: int) -> None:
    """Remove all scheduled reminder jobs for a task."""
    prefix = f"reminder_{task_id}_"
    for job in scheduler.get_jobs():
        if job.id.startswith(prefix):
            job.remove()
