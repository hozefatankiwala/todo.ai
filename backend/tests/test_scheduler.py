import asyncio
import datetime
import json
from datetime import datetime as dt, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.schedulers.base import STATE_RUNNING, STATE_STOPPED
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.push_subscription import PushSubscription
from app.models.task import Task
from app.scheduler import jobs
from app.services import scheduler_service


def make_test_scheduler() -> AsyncIOScheduler:
    return AsyncIOScheduler(jobstores={"default": MemoryJobStore()})


def make_task(task_id: int, offsets: list[int]) -> SimpleNamespace:
    deadline = dt.now(tz=timezone.utc) + timedelta(hours=2)
    return SimpleNamespace(id=task_id, offsets=offsets, deadline_at=deadline)


async def test_scheduler_starts_and_stops():
    sched = make_test_scheduler()
    sched.start()
    assert sched.state == STATE_RUNNING
    sched.shutdown(wait=False)
    await asyncio.sleep(0.05)
    assert sched.state == STATE_STOPPED


async def test_schedule_reminders_creates_jobs_with_correct_ids():
    sched = make_test_scheduler()
    sched.start()

    task = make_task(task_id=42, offsets=[15, 60])

    with patch.object(scheduler_service, "scheduler", sched):
        scheduler_service.schedule_reminders(task)

    job_ids = {job.id for job in sched.get_jobs()}
    assert "reminder_42_15" in job_ids
    assert "reminder_42_60" in job_ids

    sched.shutdown(wait=False)


async def test_cancel_task_jobs_removes_all_jobs_for_task():
    sched = make_test_scheduler()
    sched.start()

    task = make_task(task_id=7, offsets=[30, 120, 1440])

    with patch.object(scheduler_service, "scheduler", sched):
        scheduler_service.schedule_reminders(task)
        assert len(sched.get_jobs()) == 3

        scheduler_service.cancel_task_jobs(7)
        assert len(sched.get_jobs()) == 0

    sched.shutdown(wait=False)


async def test_cancel_task_jobs_only_removes_target_task():
    sched = make_test_scheduler()
    sched.start()

    task_a = make_task(task_id=1, offsets=[60])
    task_b = make_task(task_id=2, offsets=[30])

    with patch.object(scheduler_service, "scheduler", sched):
        scheduler_service.schedule_reminders(task_a)
        scheduler_service.schedule_reminders(task_b)
        assert len(sched.get_jobs()) == 2

        scheduler_service.cancel_task_jobs(1)
        remaining = {job.id for job in sched.get_jobs()}
        assert remaining == {"reminder_2_30"}

    sched.shutdown(wait=False)


async def test_schedule_reminders_with_empty_offsets_creates_no_jobs():
    sched = make_test_scheduler()
    sched.start()

    task = make_task(task_id=99, offsets=[])

    with patch.object(scheduler_service, "scheduler", sched):
        scheduler_service.schedule_reminders(task)
        assert len(sched.get_jobs()) == 0

    sched.shutdown(wait=False)


async def test_schedule_reminders_with_none_offsets_creates_no_jobs():
    sched = make_test_scheduler()
    sched.start()

    task = make_task(task_id=99, offsets=[])
    task.offsets = None

    with patch.object(scheduler_service, "scheduler", sched):
        scheduler_service.schedule_reminders(task)
        assert len(sched.get_jobs()) == 0

    sched.shutdown(wait=False)


async def test_schedule_reminders_replace_existing_prevents_duplicate_jobs():
    sched = make_test_scheduler()
    sched.start()

    task = make_task(task_id=5, offsets=[30])

    with patch.object(scheduler_service, "scheduler", sched):
        scheduler_service.schedule_reminders(task)
        scheduler_service.schedule_reminders(task)
        assert len(sched.get_jobs()) == 1

    sched.shutdown(wait=False)


async def test_schedule_reminders_with_json_string_offsets():
    """Verify schedule_reminders handles JSON string offsets (from Story 2.3 DB storage)."""
    sched = make_test_scheduler()
    sched.start()

    task = make_task(task_id=10, offsets=[])
    task.offsets = "[30, 1440]"  # JSON string, as stored in DB by Story 2.3

    with patch.object(scheduler_service, "scheduler", sched):
        scheduler_service.schedule_reminders(task)

    job_ids = {job.id for job in sched.get_jobs()}
    assert "reminder_10_30" in job_ids
    assert "reminder_10_1440" in job_ids

    sched.shutdown(wait=False)


# ---------------------------------------------------------------------------
# send_notification tests
# ---------------------------------------------------------------------------


def _make_sync_test_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(engine)


def _make_deadline():
    return datetime.datetime(2026, 6, 5, 10, 0, tzinfo=datetime.timezone.utc)


def test_send_notification_calls_push_service(monkeypatch):
    Session = _make_sync_test_session()
    with Session() as session:
        task = Task(name="Buy milk", deadline_at=_make_deadline(), offsets=json.dumps([60]), is_completed=False)
        session.add(task)
        sub = PushSubscription(endpoint="https://ex.com", p256dh="abc", auth="xyz")
        session.add(sub)
        session.commit()
        task_id = task.id

    monkeypatch.setattr("app.scheduler.jobs._SyncSession", Session)

    with patch("app.scheduler.jobs.push_service.send_web_push") as mock_push:
        jobs.send_notification(task_id, 60)

    mock_push.assert_called_once()
    payload = mock_push.call_args[0][1]
    assert payload["title"] == "Buy milk"
    assert payload["body"] == "Buy milk — due in 1 hour"
    assert payload["task_id"] == str(task_id)


def test_send_notification_skips_missing_task(monkeypatch):
    Session = _make_sync_test_session()
    monkeypatch.setattr("app.scheduler.jobs._SyncSession", Session)

    with patch("app.scheduler.jobs.push_service.send_web_push") as mock_push:
        jobs.send_notification(99999, 60)

    mock_push.assert_not_called()


def test_send_notification_skips_completed_task(monkeypatch):
    Session = _make_sync_test_session()
    with Session() as session:
        task = Task(name="Done task", deadline_at=_make_deadline(), is_completed=True)
        session.add(task)
        session.commit()
        task_id = task.id

    monkeypatch.setattr("app.scheduler.jobs._SyncSession", Session)

    with patch("app.scheduler.jobs.push_service.send_web_push") as mock_push:
        jobs.send_notification(task_id, 60)

    mock_push.assert_not_called()


def test_send_notification_no_subscriptions(monkeypatch):
    Session = _make_sync_test_session()
    with Session() as session:
        task = Task(name="Walk dog", deadline_at=_make_deadline(), is_completed=False)
        session.add(task)
        session.commit()
        task_id = task.id

    monkeypatch.setattr("app.scheduler.jobs._SyncSession", Session)

    with patch("app.scheduler.jobs.push_service.send_web_push") as mock_push:
        jobs.send_notification(task_id, 30)

    mock_push.assert_not_called()


def test_human_offset_mapping():
    assert jobs._human_offset(15) == "15 minutes"
    assert jobs._human_offset(30) == "30 minutes"
    assert jobs._human_offset(60) == "1 hour"
    assert jobs._human_offset(1440) == "1 day"
    assert jobs._human_offset(2880) == "2 days"
    assert jobs._human_offset(90) == "90 minutes"
