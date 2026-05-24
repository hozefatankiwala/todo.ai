from datetime import UTC, datetime

from pydantic import AwareDatetime, BaseModel, ConfigDict, model_validator


def _ensure_utc(dt: datetime | None) -> datetime | None:
    """Attach UTC tzinfo to naive datetimes returned by SQLite."""
    if dt is None or dt.tzinfo is not None:
        return dt
    return dt.replace(tzinfo=UTC)


class TaskCreate(BaseModel):
    name: str
    deadline_at: AwareDatetime
    description: str | None = None


class TaskUpdate(BaseModel):
    name: str | None = None
    deadline_at: AwareDatetime | None = None
    description: str | None = None


class TaskRead(BaseModel):
    id: int
    name: str
    deadline_at: datetime
    description: str | None = None
    is_completed: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='after')
    def attach_utc(self) -> 'TaskRead':
        self.deadline_at = _ensure_utc(self.deadline_at)  # type: ignore[assignment]
        self.completed_at = _ensure_utc(self.completed_at)
        self.created_at = _ensure_utc(self.created_at)  # type: ignore[assignment]
        self.updated_at = _ensure_utc(self.updated_at)  # type: ignore[assignment]
        return self
