from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message

class HeadMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "HEAD":
            request.scope["method"] = "GET"
            response = await call_next(request)
            request.scope["method"] = "HEAD"
            
            # Create a new response with no content but same headers/status
            # We must be careful with Content-Length if we strip the body
            headers = dict(response.headers)
            
            # If the original response had a Content-Length, we should technically keep it 
            # to match what a GET would return, but send no body.
            
            return Response(
                content=b"",
                status_code=response.status_code,
                headers=headers,
                media_type=response.media_type,
            )
        return await call_next(request)
