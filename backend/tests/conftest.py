from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models.base import Base


_SCHEDULER_TEST_MODULES = {"tests.test_scheduler", "test_scheduler"}


@pytest.fixture(autouse=True)
def mock_scheduler_service(request):
    """Auto-mock scheduler service calls for API tests; pass through for scheduler unit tests."""
    if request.module.__name__ in _SCHEDULER_TEST_MODULES:
        yield
        return
    with patch("app.services.task_service.scheduler_service.schedule_reminders"), \
         patch("app.services.task_service.scheduler_service.cancel_task_jobs"):
        yield


@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.main.scheduler.start"), patch("app.main.scheduler.shutdown"):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac
    app.dependency_overrides.clear()
