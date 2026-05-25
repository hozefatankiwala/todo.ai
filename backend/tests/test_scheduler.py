import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.schedulers.base import STATE_RUNNING, STATE_STOPPED

from app.services import scheduler_service


def make_test_scheduler() -> AsyncIOScheduler:
    return AsyncIOScheduler(jobstores={"default": MemoryJobStore()})


def make_task(task_id: int, offsets: list[int]) -> SimpleNamespace:
    deadline = datetime.now(tz=timezone.utc) + timedelta(hours=2)
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
