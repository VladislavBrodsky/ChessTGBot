import time
import threading
import urllib.request
import uvicorn
from fastapi import FastAPI, Response
from app.middleware.head_middleware import HeadMiddleware

app = FastAPI()
app.add_middleware(HeadMiddleware)

@app.get("/test")
def read_test():
    return Response(content="Hello World", media_type="text/plain")

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")

if __name__ == "__main__":
    # Start uvicorn in a daemon thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Wait for server to start
    time.sleep(2)
    
    print("\n--- Making HEAD Request to uvicorn ---")
    try:
        req = urllib.request.Request("http://127.0.0.1:8001/test", method="HEAD")
        with urllib.request.urlopen(req, timeout=3) as res:
            print(f"Status Code: {res.status}")
            print(f"Content-Length: {res.headers.get('content-length')}")
            print(f"Body: {res.read()}")
            print("SUCCESS! No exception raised.")
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
