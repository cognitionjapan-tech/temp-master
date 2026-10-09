import asyncio
import time
from unittest.mock import AsyncMock, patch

import httpx
import pytest

import app.main as main_module
from app.main import app, data_store


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    )


async def test_refresh_cooldown(reset_data_store):
    with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
         patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
         patch.object(main_module, "REFRESH_COOLDOWN_SECONDS", 60), \
         patch("app.main.collect_data", new_callable=AsyncMock) as mock_collect:
        async with _client() as client:
            # 1 回目は成功し collect_data が呼ばれる
            resp = await client.post("/api/meters/refresh")
            assert resp.status_code == 200
            assert resp.json()["status"] == "ok"
            assert mock_collect.await_count == 1

            # クールダウン中は 429 + Retry-After
            resp = await client.post("/api/meters/refresh")
            assert resp.status_code == 429
            retry_after = int(resp.headers["Retry-After"])
            assert 1 <= retry_after <= 60
            assert mock_collect.await_count == 1

            # クールダウン経過を模擬すると再度成功
            data_store.last_manual_refresh -= 61
            resp = await client.post("/api/meters/refresh")
            assert resp.status_code == 200
            assert mock_collect.await_count == 2


async def test_collect_data_called_under_lock(reset_data_store):
    locked_during_call = []

    async def fake_collect():
        locked_during_call.append(data_store.collect_lock.locked())

    with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
         patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
         patch("app.main.collect_data", side_effect=fake_collect):
        async with _client() as client:
            resp = await client.post("/api/meters/refresh")
            assert resp.status_code == 200

    assert locked_during_call == [True]
    assert not data_store.collect_lock.locked()


async def test_refresh_already_running(reset_data_store):
    with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
         patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
         patch("app.main.collect_data", new_callable=AsyncMock) as mock_collect:
        async with data_store.collect_lock:
            async with _client() as client:
                resp = await client.post("/api/meters/refresh")
                assert resp.status_code == 202
                body = resp.json()
                assert body["status"] == "already_running"

        assert mock_collect.await_count == 0
        assert data_store.last_manual_refresh == 0.0


async def test_refresh_during_backoff(reset_data_store):
    with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
         patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
         patch("app.main.collect_data", new_callable=AsyncMock) as mock_collect:
        data_store.backoff_until = time.time() + 120
        async with _client() as client:
            resp = await client.post("/api/meters/refresh")
            assert resp.status_code == 429
            retry_after = int(resp.headers["Retry-After"])
            assert 1 <= retry_after <= 120
        assert mock_collect.await_count == 0


async def test_background_collector_uses_lock(reset_data_store):
    called = asyncio.Event()

    async def fake_locked():
        called.set()

    with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
         patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
         patch("app.main.collect_data_locked", side_effect=fake_locked):
        task = asyncio.create_task(main_module.background_collector())
        await asyncio.wait_for(called.wait(), timeout=5)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
