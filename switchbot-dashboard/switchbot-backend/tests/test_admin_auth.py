from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import app, data_store


@pytest.fixture
def client(reset_data_store) -> TestClient:
    return TestClient(app)


ADMIN_HEADERS = {"Authorization": "Bearer test-admin-token"}


def _import_payload(readings_count=1):
    return {
        "devices": [
            {
                "device_id": "device-001",
                "device_name": "Imported Meter",
                "device_type": "Meter",
                "readings": [
                    {
                        "timestamp": "2024-01-01T12:00:00Z",
                        "temperature": 25.5,
                        "humidity": 60,
                        "battery": 85,
                    }
                ]
                * readings_count,
            }
        ]
    }


class TestAdminAuthBackup:
    def test_backup_unconfigured_returns_503(self, client):
        with patch("app.main.ADMIN_API_TOKEN", ""):
            response = client.get("/api/backup", headers=ADMIN_HEADERS)

        assert response.status_code == 503
        assert response.json()["detail"] == "Admin API is not configured"

    def test_backup_no_header_returns_401(self, client):
        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"):
            response = client.get("/api/backup")

        assert response.status_code == 401
        assert response.headers["WWW-Authenticate"] == "Bearer"

    def test_backup_wrong_token_returns_401(self, client):
        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"):
            response = client.get("/api/backup", headers={"Authorization": "Bearer wrong-token"})

        assert response.status_code == 401

    def test_backup_non_bearer_scheme_returns_401(self, client):
        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"):
            for header_value in ["Basic test-admin-token", "test-admin-token"]:
                response = client.get("/api/backup", headers={"Authorization": header_value})
                assert response.status_code == 401

    def test_backup_valid_token_returns_200(self, client):
        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"):
            response = client.get("/api/backup", headers=ADMIN_HEADERS)

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/x-sqlite3"
        assert len(response.content) > 0


class TestAdminAuthImport:
    def test_import_unconfigured_returns_503(self, client):
        with patch("app.main.ADMIN_API_TOKEN", ""):
            response = client.post("/api/import", json=_import_payload(), headers=ADMIN_HEADERS)

        assert response.status_code == 503
        assert response.json()["detail"] == "Admin API is not configured"

    def test_import_no_header_returns_401(self, client):
        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"):
            response = client.post("/api/import", json=_import_payload())

        assert response.status_code == 401
        assert response.headers["WWW-Authenticate"] == "Bearer"

    def test_import_wrong_token_returns_401(self, client):
        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"):
            response = client.post(
                "/api/import",
                json=_import_payload(),
                headers={"Authorization": "Bearer wrong-token"},
            )

        assert response.status_code == 401

    def test_import_non_bearer_scheme_returns_401(self, client):
        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"):
            for header_value in ["Basic test-admin-token", "test-admin-token"]:
                response = client.post(
                    "/api/import",
                    json=_import_payload(),
                    headers={"Authorization": header_value},
                )
                assert response.status_code == 401

    def test_import_valid_token_returns_200(self, client):
        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"):
            response = client.post("/api/import", json=_import_payload(), headers=ADMIN_HEADERS)

        assert response.status_code == 200
        data = response.json()
        assert data["imported_devices"] == 1
        assert data["imported_readings"] == 1


class TestImportLimits:
    def test_import_too_many_devices_returns_413(self, client):
        payload = {
            "devices": [
                {
                    "device_id": f"device-{i:03d}",
                    "device_name": f"Meter {i}",
                    "device_type": "Meter",
                    "readings": [],
                }
                for i in range(3)
            ]
        }

        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"), \
             patch.object(main_module, "MAX_IMPORT_DEVICES", 2):
            response = client.post("/api/import", json=payload, headers=ADMIN_HEADERS)

        assert response.status_code == 413
        assert "2" in response.json()["detail"]
        assert data_store.devices == {}

    def test_import_too_many_readings_returns_413(self, client):
        payload = _import_payload(readings_count=3)

        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"), \
             patch.object(main_module, "MAX_IMPORT_READINGS", 2):
            response = client.post("/api/import", json=payload, headers=ADMIN_HEADERS)

        assert response.status_code == 413
        assert "2" in response.json()["detail"]
        assert data_store.devices == {}

    def test_import_over_limit_without_auth_returns_401(self, client):
        payload = {
            "devices": [
                {
                    "device_id": f"device-{i:03d}",
                    "device_name": f"Meter {i}",
                    "device_type": "Meter",
                    "readings": [],
                }
                for i in range(3)
            ]
        }

        with patch("app.main.ADMIN_API_TOKEN", "test-admin-token"), \
             patch.object(main_module, "MAX_IMPORT_DEVICES", 2):
            response = client.post("/api/import", json=payload)

        assert response.status_code == 401
        assert data_store.devices == {}
