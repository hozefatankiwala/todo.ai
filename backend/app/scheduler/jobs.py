"""Scheduler job functions. Must not perform DB mutations."""


def send_notification(task_id: int, offset_minutes: int) -> None:
    """Fire a push notification for a task at the scheduled offset.

    Wired to push_service in Story 2.6.
    """
    pass
