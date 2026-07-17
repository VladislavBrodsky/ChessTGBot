class HeadMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Only process HTTP HEAD requests
        if scope["type"] == "http" and scope["method"] == "HEAD":
            # Temporarily rewrite to GET so routing works automatically
            scope["method"] = "GET"
            
            # Intercept response to strip body
            async def send_no_body(message):
                if message["type"] == "http.response.start":
                    # Restore request method to HEAD so that the ASGI server (e.g. Uvicorn)
                    # knows it is a HEAD response and does not enforce a body matching Content-Length.
                    scope["method"] = "HEAD"
                elif message["type"] == "http.response.body":
                    # Send empty body back to client
                    message["body"] = b""
                await send(message)

            await self.app(scope, receive, send_no_body)
            return

        # Let all other requests (GET, POST, websocket, etc.) pass through completely untouched
        await self.app(scope, receive, send)


