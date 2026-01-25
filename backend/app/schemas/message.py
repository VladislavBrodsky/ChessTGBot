from pydantic import BaseModel
from typing import Any, Optional

class SocketMessage(BaseModel):
    type: str # 'move', 'join', 'chat'
    payload: Any

class MovePayload(BaseModel):
    game_id: str
    uci: str # e.g. "e2e4"

class ErrorResponse(BaseModel):
    code: int
    message: str
