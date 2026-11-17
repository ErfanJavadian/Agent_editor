"""Nango integration tests that do not require external credentials."""

from fastapi.testclient import TestClient

from app.integrations.nango import NangoService
from app.main import create_app


def test_nango_status_does_not_expose_credentials(monkeypatch) -> None:
    monkeypatch.setenv("NANGO_API_KEY", "test-secret")
    client = TestClient(create_app())

    response = client.get("/api/v1/integrations/nango/status")

    assert response.status_code == 200
    assert response.json() == {"configured": True, "provider": "github"}
    assert "test-secret" not in response.text


def test_nango_status_reports_missing_key(monkeypatch) -> None:
    monkeypatch.delenv("NANGO_API_KEY", raising=False)
    client = TestClient(create_app())

    response = client.get("/api/v1/integrations/nango/status")

    assert response.status_code == 200
    assert response.json()["configured"] is False


def test_connect_requires_a_local_api_key(monkeypatch) -> None:
    monkeypatch.delenv("NANGO_API_KEY", raising=False)
    client = TestClient(create_app())

    response = client.post("/api/v1/integrations/nango/github/connect")

    assert response.status_code == 503
    assert "NANGO_API_KEY" in response.json()["detail"]


def test_session_is_scoped_to_one_local_user_and_github() -> None:
    service = NangoService()
    payload = service.build_session_payload()

    assert payload["tenant"]["connections"]["any"] == [
        {"tags": {"end_user_id": "agent-editor-local-user"}}
    ]
    assert payload["toolset"] == {"github": "*"}
    assert payload["meta_tools"]["nango_create_connection"]["enabled"] is True
    assert payload["expires_in"] == "10m"


def test_tool_result_finds_connect_url_in_nested_payload() -> None:
    payload = {
        "content": [
            {
                "text": (
                    '{"guidance":"Authorize GitHub","connect_url":'
                    '"https://connect.nango.dev/?session_token=temporary"}'
                )
            }
        ],
        "is_error": False,
    }

    assert NangoService._find_value(payload, "connect_url") == (
        "https://connect.nango.dev/?session_token=temporary"
    )
