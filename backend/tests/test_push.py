"""Tests for push subscription endpoint and push_service."""

from unittest.mock import patch

import pytest
from httpx import AsyncClient
from pywebpush import WebPushException


SUBSCRIBE_URL = "/api/v1/push/subscribe"

SAMPLE_SUB = {
    "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlIizOpxXMjKHY-WEMnER2wPtSMPcFE_5mxlaVDA",
    "auth": "tBHItJI5svbpez7KI4CCXg",
}


@pytest.mark.asyncio
async def test_subscribe_new_endpoint_returns_201(client: AsyncClient):
    response = await client.post(SUBSCRIBE_URL, json=SAMPLE_SUB)
    assert response.status_code == 201
    data = response.json()
    assert data["endpoint"] == SAMPLE_SUB["endpoint"]
    assert data["p256dh"] == SAMPLE_SUB["p256dh"]
    assert data["auth"] == SAMPLE_SUB["auth"]
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_subscribe_same_endpoint_returns_200_and_updates(client: AsyncClient):
    # First subscription
    await client.post(SUBSCRIBE_URL, json=SAMPLE_SUB)

    # Second call with updated keys
    updated = {**SAMPLE_SUB, "p256dh": "NEW_P256DH_KEY", "auth": "NEW_AUTH_KEY"}
    response = await client.post(SUBSCRIBE_URL, json=updated)
    assert response.status_code == 200
    data = response.json()
    assert data["endpoint"] == SAMPLE_SUB["endpoint"]
    assert data["p256dh"] == "NEW_P256DH_KEY"
    assert data["auth"] == "NEW_AUTH_KEY"


@pytest.mark.asyncio
async def test_subscribe_different_endpoints_both_stored(client: AsyncClient):
    sub2 = {**SAMPLE_SUB, "endpoint": "https://fcm.googleapis.com/fcm/send/other-endpoint"}
    r1 = await client.post(SUBSCRIBE_URL, json=SAMPLE_SUB)
    r2 = await client.post(SUBSCRIBE_URL, json=sub2)
    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r1.json()["id"] != r2.json()["id"]


def test_send_web_push_skips_when_no_vapid_key(monkeypatch):
    from app.services import push_service
    from app.models.push_subscription import PushSubscription

    monkeypatch.setattr("app.services.push_service.settings.vapid_private_key", "")
    sub = PushSubscription(endpoint="https://ex.com", p256dh="abc", auth="xyz")

    with patch("app.services.push_service.webpush") as mock_webpush:
        push_service.send_web_push(sub, {"title": "Test"})
        mock_webpush.assert_not_called()


def test_send_web_push_logs_on_webpush_exception(monkeypatch):
    from app.services import push_service
    from app.models.push_subscription import PushSubscription

    monkeypatch.setattr("app.services.push_service.settings.vapid_private_key", "fake_key")
    monkeypatch.setattr("app.services.push_service.settings.vapid_claim_email", "test@test.com")
    sub = PushSubscription(endpoint="https://ex.com", p256dh="abc", auth="xyz")

    with patch("app.services.push_service.webpush", side_effect=WebPushException("expired")):
        # Must NOT raise
        push_service.send_web_push(sub, {"title": "Test"})


def test_send_web_push_logs_on_generic_exception(monkeypatch):
    from app.services import push_service
    from app.models.push_subscription import PushSubscription

    monkeypatch.setattr("app.services.push_service.settings.vapid_private_key", "fake_key")
    monkeypatch.setattr("app.services.push_service.settings.vapid_claim_email", "test@test.com")
    sub = PushSubscription(endpoint="https://ex.com", p256dh="abc", auth="xyz")

    with patch("app.services.push_service.webpush", side_effect=RuntimeError("network error")):
        # Must NOT raise
        push_service.send_web_push(sub, {"title": "Test"})


def test_send_web_push_uses_nested_keys_subscription_info(monkeypatch):
    from app.services import push_service
    from app.models.push_subscription import PushSubscription

    monkeypatch.setattr("app.services.push_service.settings.vapid_private_key", "fake_key")
    monkeypatch.setattr("app.services.push_service.settings.vapid_claim_email", "test@test.com")
    sub = PushSubscription(endpoint="https://ex.com", p256dh="p256dh_val", auth="auth_val")

    with patch("app.services.push_service.webpush") as mock_webpush:
        push_service.send_web_push(sub, {"title": "Hello"})
        mock_webpush.assert_called_once()
        call_kwargs = mock_webpush.call_args.kwargs
        assert call_kwargs["subscription_info"]["endpoint"] == "https://ex.com"
        assert call_kwargs["subscription_info"]["keys"]["p256dh"] == "p256dh_val"
        assert call_kwargs["subscription_info"]["keys"]["auth"] == "auth_val"
