"""Tests for the health-check endpoints.

Both /health and /api/v1/health must return HTTP 200 with a JSON body containing
{ status, environment, timestamp }.
"""

from fastapi.testclient import TestClient


def test_root_health_returns_200(test_client: TestClient) -> None:
    """GET /health should return 200 OK."""
    response = test_client.get("/health")
    assert response.status_code == 200


def test_root_health_response_shape(test_client: TestClient) -> None:
    """GET /health body must contain status, environment, and timestamp keys."""
    response = test_client.get("/health")
    body = response.json()
    assert body["status"] == "ok"
    assert "environment" in body
    assert "timestamp" in body


def test_versioned_health_returns_200(test_client: TestClient) -> None:
    """GET /api/v1/health should return 200 OK."""
    response = test_client.get("/api/v1/health")
    assert response.status_code == 200


def test_versioned_health_response_shape(test_client: TestClient) -> None:
    """GET /api/v1/health body must match the same shape as /health."""
    response = test_client.get("/api/v1/health")
    body = response.json()
    assert body["status"] == "ok"
    assert "environment" in body
    assert "timestamp" in body


def test_health_environment_is_string(test_client: TestClient) -> None:
    """The environment field must be a non-empty string."""
    body = test_client.get("/health").json()
    assert isinstance(body["environment"], str)
    assert len(body["environment"]) > 0


def test_health_timestamp_is_iso8601(test_client: TestClient) -> None:
    """The timestamp field must be a valid ISO-8601 string."""
    from datetime import datetime

    body = test_client.get("/health").json()
    # Will raise ValueError if not valid ISO-8601
    dt = datetime.fromisoformat(body["timestamp"])
    assert dt is not None
