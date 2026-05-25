import json
from collections import defaultdict
from typing import Any, Dict, Set

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: Dict[int, Set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        self.active[user_id].discard(websocket)
        if not self.active[user_id]:
            self.active.pop(user_id, None)

    async def broadcast_to_user(self, user_id: int, payload: Dict[str, Any]) -> None:
        message = json.dumps(payload, default=str)
        stale = []
        for websocket in self.active.get(user_id, set()):
            try:
                await websocket.send_text(message)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(user_id, websocket)


manager = ConnectionManager()

