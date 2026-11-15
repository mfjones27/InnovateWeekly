import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import storage  # noqa: E402

PAYLOAD = {
    "employee_name": "Ada",
    "team_or_department": "R&D",
    "weekly_accomplishments": "Shipped the thing",
    "goals_next_week": "Ship the next thing",
}


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)
    monkeypatch.setattr(storage, "DATA_FILE", tmp_path / "submissions.json")
    from main import app
    return TestClient(app)


def test_crud_round_trip(client):
    assert client.get("/").status_code == 200
    created = client.post("/submissions/", json=PAYLOAD)
    assert created.status_code == 201, created.text
    sid = created.json()["id"]
    assert client.get(f"/submissions/{sid}").json()["employee_name"] == "Ada"
    assert len(client.get("/submissions/").json()) == 1
    updated = client.put(f"/submissions/{sid}", json={**PAYLOAD, "employee_name": "Grace"})
    assert updated.json()["employee_name"] == "Grace"
    assert client.delete(f"/submissions/{sid}").status_code == 204
    assert client.get(f"/submissions/{sid}").status_code == 404


def test_validation(client):
    assert client.post("/submissions/", json={**PAYLOAD, "employee_name": ""}).status_code == 422


def test_cors_allows_dev_origin_only(client):
    ok = client.get("/", headers={"Origin": "http://localhost:3000"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    for evil in ("https://attacker.vercel.app", "https://x.netlify.app", "https://evil.example"):
        r = client.get("/", headers={"Origin": evil})
        assert r.headers.get("access-control-allow-origin") is None, evil
