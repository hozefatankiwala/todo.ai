"""
Task service — all business logic for task CRUD.
Convention: each function owns its own db.commit() call (service-level commit per logical write).
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


async def list_tasks(db: AsyncSession, include_archived: bool = False) -> list[Task]:
    stmt = select(Task)
    if not include_archived:
        stmt = stmt.where(Task.is_completed == False)  # noqa: E712
    stmt = stmt.order_by(Task.deadline_at.asc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_task(db: AsyncSession, task_id: int) -> Task | None:
    result = await db.execute(select(Task).where(Task.id == task_id))
    return result.scalar_one_or_none()


async def create_task(db: AsyncSession, data: TaskCreate) -> Task:
    task = Task(**data.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


_TASK_UPDATE_FIELDS = frozenset(TaskUpdate.model_fields)


async def update_task(db: AsyncSession, task_id: int, data: TaskUpdate) -> Task | None:
    task = await get_task(db, task_id)
    if task is None:
        return None
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field in _TASK_UPDATE_FIELDS:
            setattr(task, field, value)
    task.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(task)
    return task


async def complete_task(db: AsyncSession, task_id: int) -> Task | None:
    task = await get_task(db, task_id)
    if task is None:
        return None
    if not task.is_completed:
        task.is_completed = True
        task.completed_at = datetime.now(UTC)
        task.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(db: AsyncSession, task_id: int) -> bool:
    task = await get_task(db, task_id)
    if task is None:
        return False
    await db.delete(task)
    await db.commit()
    return True
