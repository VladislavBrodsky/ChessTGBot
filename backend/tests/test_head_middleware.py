import pytest
from fastapi import FastAPI, Response
from fastapi.testclient import TestClient
from app.middleware.head_middleware import HeadMiddleware

def test_head_middleware():
    app = FastAPI()
    app.add_middleware(HeadMiddleware)

    @app.get("/test")
    def get_test():
        return Response(content="Hello World", media_type="text/plain")

    client = TestClient(app)
    
    # Check GET request first
    response_get = client.get("/test")
    assert response_get.status_code == 200
    assert response_get.text == "Hello World"
    assert response_get.headers.get("content-length") == "11"

    # Check HEAD request
    response_head = client.head("/test")
    assert response_head.status_code == 200
    assert response_head.text == ""
    assert response_head.headers.get("content-length") == "11"
