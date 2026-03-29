"""Tests for the children CRUD endpoints.

All tests use the ``http_client`` fixture (mongomock in-memory database +
fake authenticated parent) so no real MongoDB or valid JWT is required.
"""

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient


# ── List children ─────────────────────────────────────────────────────────────

def test_list_children_empty(http_client: TestClient):
    """GET /api/v1/children returns an empty list when the parent has no children."""
    response = http_client.get("/api/v1/children")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"] == []


# ── Create child ──────────────────────────────────────────────────────────────

def test_create_child_returns_201(http_client: TestClient):
    """POST /api/v1/children creates a child profile and returns HTTP 201."""
    payload = {
        "display_name": "Alice",
        "date_of_birth": "2019-06-15",
        "avatar_id": 2,
        "skill_focuses": ["communication", "creativity"],
    }
    response = http_client.post("/api/v1/children", json=payload)
    assert response.status_code == 201


def test_create_child_response_fields(http_client: TestClient):
    """Created child response contains all expected fields with correct values."""
    payload = {
        "display_name": "Bob",
        "date_of_birth": "2018-03-20",
        "avatar_id": 1,
        "skill_focuses": ["focus"],
    }
    body = http_client.post("/api/v1/children", json=payload).json()
    data = body["data"]

    assert body["success"] is True
    assert data["display_name"] == "Bob"
    assert data["date_of_birth"] == "2018-03-20"
    assert data["avatar_id"] == 1
    assert data["skill_focuses"] == ["focus"]
    assert "id" in data
    assert len(data["id"]) == 24   # ObjectId hex string


def test_create_child_appears_in_list(http_client: TestClient):
    """Child created via POST appears when listing children."""
    http_client.post("/api/v1/children", json={
        "display_name": "Charlie",
        "date_of_birth": "2020-01-01",
    })
    body = http_client.get("/api/v1/children").json()
    names = [c["display_name"] for c in body["data"]]
    assert "Charlie" in names


# ── Get single child ──────────────────────────────────────────────────────────

def test_get_child_by_id(http_client: TestClient):
    """GET /api/v1/children/{id} returns the correct child."""
    created = http_client.post("/api/v1/children", json={
        "display_name": "Diana",
        "date_of_birth": "2017-09-10",
    }).json()
    child_id = created["data"]["id"]

    response = http_client.get(f"/api/v1/children/{child_id}")
    assert response.status_code == 200
    assert response.json()["data"]["display_name"] == "Diana"


def test_get_nonexistent_child_returns_404(http_client: TestClient):
    """GET /api/v1/children/{random_id} returns 404 when the child doesn't exist."""
    response = http_client.get(f"/api/v1/children/{ObjectId()}")
    assert response.status_code == 404


def test_get_invalid_child_id_returns_404(http_client: TestClient):
    """GET /api/v1/children/not-valid returns 404 for a non-ObjectId string."""
    response = http_client.get("/api/v1/children/not-a-valid-id")
    assert response.status_code == 404


# ── Update child ──────────────────────────────────────────────────────────────

def test_update_child_display_name(http_client: TestClient):
    """PUT /api/v1/children/{id} updates display_name correctly."""
    child_id = http_client.post("/api/v1/children", json={
        "display_name": "Eve",
        "date_of_birth": "2016-12-25",
    }).json()["data"]["id"]

    response = http_client.put(f"/api/v1/children/{child_id}", json={
        "display_name": "Eve Updated",
    })
    assert response.status_code == 200
    assert response.json()["data"]["display_name"] == "Eve Updated"


# ── Delete child ──────────────────────────────────────────────────────────────

def test_delete_child_returns_204(http_client: TestClient):
    """DELETE /api/v1/children/{id} returns 204 No Content."""
    child_id = http_client.post("/api/v1/children", json={
        "display_name": "Frank",
        "date_of_birth": "2015-07-04",
    }).json()["data"]["id"]

    response = http_client.delete(f"/api/v1/children/{child_id}")
    assert response.status_code == 204


def test_deleted_child_not_visible(http_client: TestClient):
    """Soft-deleted child is no longer returned by GET or list endpoints."""
    child_id = http_client.post("/api/v1/children", json={
        "display_name": "Grace",
        "date_of_birth": "2021-02-14",
    }).json()["data"]["id"]

    http_client.delete(f"/api/v1/children/{child_id}")

    assert http_client.get(f"/api/v1/children/{child_id}").status_code == 404
    names = [c["display_name"] for c in http_client.get("/api/v1/children").json()["data"]]
    assert "Grace" not in names
