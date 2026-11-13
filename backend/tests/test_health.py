"""Basic API contract tests."""

from fastapi.testclient import TestClient

from app.main import create_app


def test_health_endpoint_returns_expected_payload() -> None:
    client = TestClient(create_app())
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["app"] == "Agent Editor"
    assert response.json()["version"] == "0.1.0"


def test_root_endpoint_points_to_health_and_docs() -> None:
    client = TestClient(create_app())
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["health"] == "/api/v1/health"
    assert response.json()["docs"] == "/api/docs"
