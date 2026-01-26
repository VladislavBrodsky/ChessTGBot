import httpx
import asyncio
import sys

async def verify_head_requests(base_url):
    routes = [
        "/api/v1/game/create",
        "/api/v1/users/123456",
        "/api/v1/health",
        "/version",
        "/"
    ]
    
    async with httpx.AsyncClient(base_url=base_url) as client:
        print(f"Testing HEAD requests on {base_url}...")
        for route in routes:
            try:
                # We use a POST for /create, but we test HEAD on what should be GET routes or general endpoints
                # Actually, let's test specific GET routes mentioned in the audit
                response = await client.head(route)
                print(f"HEAD {route:25} -> Status: {response.status_code}")
                if response.status_code == 405:
                    print(f"  ❌ FAILED: Method Not Allowed")
                elif response.status_code == 200 or response.status_code == 404: # 404 is also fine if the entity doesn't exist, as long as it's not 405
                    print(f"  ✅ PASSED")
                else:
                    print(f"  ℹ️ Status: {response.status_code}")
                    
            except Exception as e:
                print(f"HEAD {route:25} -> ❌ ERROR: {e}")

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    asyncio.run(verify_head_requests(url))
