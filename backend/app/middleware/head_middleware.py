from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class HeadMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "HEAD":
            # Change method to GET for internal processing
            request.scope["method"] = "GET"
            response = await call_next(request)
            # Revert method back to HEAD
            request.scope["method"] = "HEAD"
            # Return response with empty body but same headers
            return Response(
                content=b"",
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )
        return await call_next(request)
