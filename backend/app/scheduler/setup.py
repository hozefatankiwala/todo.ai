from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings

_sync_url = settings.database_url.replace("+aiosqlite", "")
_job_store = SQLAlchemyJobStore(url=_sync_url)

scheduler = AsyncIOScheduler(jobstores={"default": _job_store})
