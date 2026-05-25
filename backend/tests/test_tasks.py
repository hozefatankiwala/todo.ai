"""Integration tests for /api/v1/tasks/ endpoints."""

import pytest
from datetime import datetime
from unittest.mock import patch
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_tasks_empty(client: AsyncClient):
    response = await client.get("/api/v1/tasks/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_task_returns_all_fields(client: AsyncClient):
    payload = {"name": "Call dentist", "deadline_at": "2026-06-05T10:00:00Z"}
    response = await client.post("/api/v1/tasks/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Call dentist"
    # deadline_at round-trips as UTC ISO 8601
    assert "2026-06-05" in data["deadline_at"]
    assert data["is_completed"] is False
    assert data["completed_at"] is None
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert "description" in data
    # No camelCase
    assert "deadlineAt" not in data


@pytest.mark.asyncio
async def test_get_task_found(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/", json={"name": "Task A", "deadline_at": "2026-07-01T09:00:00Z"}
    )
    task_id = post.json()["id"]
    response = await client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["id"] == task_id


@pytest.mark.asyncio
async def test_get_task_not_found(client: AsyncClient):
    response = await client.get("/api/v1/tasks/99999")
    assert response.status_code == 404
    body = response.json()
    assert body["detail"] == "Task not found"
    assert body["code"] == "TASK_NOT_FOUND"


@pytest.mark.asyncio
async def test_patch_partial_update(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/",
        json={"name": "Original", "deadline_at": "2026-08-01T12:00:00Z", "description": "old"},
    )
    task = post.json()
    task_id = task["id"]
    original_updated_at = task["updated_at"]

    patch = await client.patch(f"/api/v1/tasks/{task_id}", json={"name": "Updated"})
    assert patch.status_code == 200
    updated = patch.json()
    assert updated["name"] == "Updated"
    assert updated["description"] == "old"  # unchanged
    # updated_at should be the same or later (SQLite may not advance sub-second)
    assert datetime.fromisoformat(updated["updated_at"]) >= datetime.fromisoformat(original_updated_at)


@pytest.mark.asyncio
async def test_patch_not_found(client: AsyncClient):
    response = await client.patch("/api/v1/tasks/99999", json={"name": "X"})
    assert response.status_code == 404
    body = response.json()
    assert body["code"] == "TASK_NOT_FOUND"


@pytest.mark.asyncio
async def test_complete_task_and_archived_filter(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/", json={"name": "Buy milk", "deadline_at": "2026-09-01T08:00:00Z"}
    )
    task_id = post.json()["id"]

    # Complete it
    resp = await client.post(f"/api/v1/tasks/{task_id}/complete")
    assert resp.status_code == 204

    # Default list excludes completed
    active = await client.get("/api/v1/tasks/")
    assert all(t["id"] != task_id for t in active.json())

    # include_archived=true includes it
    archived = await client.get("/api/v1/tasks/?include_archived=true")
    ids = [t["id"] for t in archived.json()]
    assert task_id in ids

    # Capture completed_at before second complete
    detail_before = await client.get(f"/api/v1/tasks/{task_id}")
    completed_at_before = detail_before.json()["completed_at"]
    assert completed_at_before is not None

    # Calling complete again is idempotent — 204, completed_at unchanged
    resp2 = await client.post(f"/api/v1/tasks/{task_id}/complete")
    assert resp2.status_code == 204

    detail_after = await client.get(f"/api/v1/tasks/{task_id}")
    assert detail_after.json()["completed_at"] == completed_at_before


@pytest.mark.asyncio
async def test_complete_task_not_found(client: AsyncClient):
    response = await client.post("/api/v1/tasks/99999/complete")
    assert response.status_code == 404
    assert response.json()["code"] == "TASK_NOT_FOUND"


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/", json={"name": "Temp task", "deadline_at": "2026-10-01T10:00:00Z"}
    )
    task_id = post.json()["id"]

    del_resp = await client.delete(f"/api/v1/tasks/{task_id}")
    assert del_resp.status_code == 204

    get_resp = await client.get(f"/api/v1/tasks/{task_id}")
    assert get_resp.status_code == 404
    assert get_resp.json()["code"] == "TASK_NOT_FOUND"


@pytest.mark.asyncio
async def test_delete_not_found(client: AsyncClient):
    response = await client.delete("/api/v1/tasks/99999")
    assert response.status_code == 404
    assert response.json()["code"] == "TASK_NOT_FOUND"


@pytest.mark.asyncio
async def test_list_sorted_by_deadline_ascending(client: AsyncClient):
    # Insert with deadlines reversed
    await client.post(
        "/api/v1/tasks/", json={"name": "Later task", "deadline_at": "2026-12-31T00:00:00Z"}
    )
    await client.post(
        "/api/v1/tasks/", json={"name": "Earlier task", "deadline_at": "2026-11-01T00:00:00Z"}
    )

    resp = await client.get("/api/v1/tasks/")
    tasks = resp.json()
    assert tasks[0]["name"] == "Earlier task"
    assert tasks[1]["name"] == "Later task"


@pytest.mark.asyncio
async def test_create_task_with_offsets(client: AsyncClient):
    payload = {"name": "Reminder task", "deadline_at": "2026-06-10T10:00:00Z", "offsets": [15, 60]}
    response = await client.post("/api/v1/tasks/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["offsets"] == [15, 60]


@pytest.mark.asyncio
async def test_create_task_without_offsets_defaults_empty(client: AsyncClient):
    payload = {"name": "No reminder", "deadline_at": "2026-06-10T11:00:00Z"}
    response = await client.post("/api/v1/tasks/", json=payload)
    assert response.status_code == 201
    assert response.json()["offsets"] == []


@pytest.mark.asyncio
async def test_patch_task_offsets(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/", json={"name": "Task", "deadline_at": "2026-06-10T12:00:00Z"}
    )
    task_id = post.json()["id"]

    patch = await client.patch(f"/api/v1/tasks/{task_id}", json={"offsets": [1440]})
    assert patch.status_code == 200
    assert patch.json()["offsets"] == [1440]


@pytest.mark.asyncio
async def test_get_task_returns_offsets(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/",
        json={"name": "Task with offsets", "deadline_at": "2026-06-10T13:00:00Z", "offsets": [30, 1440]},
    )
    task_id = post.json()["id"]

    response = await client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["offsets"] == [30, 1440]


# --- Scheduler integration tests ---


@pytest.mark.asyncio
async def test_create_task_with_offsets_calls_schedule_reminders(client: AsyncClient):
    with patch("app.services.task_service.scheduler_service.schedule_reminders") as mock_sched:
        response = await client.post(
            "/api/v1/tasks/",
            json={"name": "Reminder task", "deadline_at": "2026-06-05T10:00:00Z", "offsets": [60, 1440]},
        )
    assert response.status_code == 201
    mock_sched.assert_called_once()
    task_arg = mock_sched.call_args[0][0]
    assert task_arg.id is not None
    # offsets is stored as JSON string in DB
    assert task_arg.offsets == "[60, 1440]"


@pytest.mark.asyncio
async def test_create_task_without_offsets_calls_schedule_reminders(client: AsyncClient):
    with patch("app.services.task_service.scheduler_service.schedule_reminders") as mock_sched:
        response = await client.post(
            "/api/v1/tasks/",
            json={"name": "No reminder", "deadline_at": "2026-06-05T10:00:00Z"},
        )
    assert response.status_code == 201
    mock_sched.assert_called_once()


@pytest.mark.asyncio
async def test_update_task_cancels_then_reschedules(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/",
        json={"name": "Task", "deadline_at": "2026-07-01T09:00:00Z"},
    )
    task_id = post.json()["id"]

    call_order = []

    with patch("app.services.task_service.scheduler_service.cancel_task_jobs", side_effect=lambda tid: call_order.append("cancel")) as mock_cancel, \
         patch("app.services.task_service.scheduler_service.schedule_reminders", side_effect=lambda t: call_order.append("schedule")) as mock_sched:
        response = await client.patch(f"/api/v1/tasks/{task_id}", json={"name": "Updated"})

    assert response.status_code == 200
    mock_cancel.assert_called_once_with(task_id)
    mock_sched.assert_called_once()
    assert call_order == ["cancel", "schedule"]


@pytest.mark.asyncio
async def test_complete_task_cancels_jobs(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/",
        json={"name": "Task", "deadline_at": "2026-07-01T09:00:00Z"},
    )
    task_id = post.json()["id"]

    with patch("app.services.task_service.scheduler_service.cancel_task_jobs") as mock_cancel:
        response = await client.post(f"/api/v1/tasks/{task_id}/complete")

    assert response.status_code == 204
    mock_cancel.assert_called_once_with(task_id)


@pytest.mark.asyncio
async def test_delete_task_cancels_jobs(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/",
        json={"name": "Task", "deadline_at": "2026-07-01T09:00:00Z"},
    )
    task_id = post.json()["id"]

    with patch("app.services.task_service.scheduler_service.cancel_task_jobs") as mock_cancel:
        response = await client.delete(f"/api/v1/tasks/{task_id}")

    assert response.status_code == 204
    mock_cancel.assert_called_once_with(task_id)
