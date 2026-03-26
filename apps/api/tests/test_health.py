from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_learning_units_available() -> None:
    response = client.get("/content/units")
    assert response.status_code == 200
    assert response.json()[0]["title"] == "第一段 Python"

