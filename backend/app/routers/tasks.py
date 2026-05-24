from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=404,
        detail={"detail": "Task not found", "code": "TASK_NOT_FOUND"},
    )


@router.get("/", response_model=list[TaskRead])
async def list_tasks(include_archived: bool = False, db: AsyncSession = Depends(get_db)):
    return await task_service.list_tasks(db, include_archived=include_archived)


@router.post("/", response_model=TaskRead, status_code=201)
async def create_task(body: TaskCreate, db: AsyncSession = Depends(get_db)):
    return await task_service.create_task(db, body)


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)):
    task = await task_service.get_task(db, task_id)
    if task is None:
        raise _not_found()
    return task


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(task_id: int, body: TaskUpdate, db: AsyncSession = Depends(get_db)):
    task = await task_service.update_task(db, task_id, body)
    if task is None:
        raise _not_found()
    return task


@router.post("/{task_id}/complete", status_code=204, response_class=Response)
async def complete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    task = await task_service.complete_task(db, task_id)
    if task is None:
        raise _not_found()


@router.delete("/{task_id}", status_code=204, response_class=Response)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await task_service.delete_task(db, task_id)
    if not deleted:
        raise _not_found()
