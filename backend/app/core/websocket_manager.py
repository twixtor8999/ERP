"""Real-Time WebSocket Connection Manager and Event Bus for Multi-Branch Command Center."""

import asyncio
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import WebSocket
from pydantic import BaseModel

from app.core.security import decode_token


class RealtimeEvent(BaseModel):
    """Structured real-time business activity event."""

    event_id: str
    event_type: str
    organization_id: str
    branch_id: str
    branch_name: str | None = None
    timestamp: str
    source_user_id: str | None = None
    source_user_name: str | None = None
    summary: str
    data: dict[str, Any] = {}


class ConnectionManager:
    """Centralized in-memory WebSocket manager with tenant and branch-scoped broadcasting."""

    def __init__(self) -> None:
        # Map of connection -> metadata dict (user_id, organization_id, subscribed_branch_id, role)
        self.active_connections: dict[WebSocket, dict[str, Any]] = {}
        # Ring buffer for event replay / missed-event recovery
        self.event_history: list[RealtimeEvent] = []
        self._max_history = 300
        self._lock = asyncio.Lock()

    async def connect(
        self,
        websocket: WebSocket,
        user_info: dict[str, Any],
        branch_subscription: str,
    ) -> None:
        """Accept connection and record metadata."""
        await websocket.accept()
        self.active_connections[websocket] = {
            "user_id": user_info.get("user_id"),
            "organization_id": user_info.get("organization_id"),
            "role": user_info.get("role"),
            "allowed_branches": user_info.get("allowed_branches", []),
            "subscribed_branch_id": branch_subscription,
            "connected_at": datetime.now(UTC).isoformat(),
        }

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove connection upon disconnect."""
        self.active_connections.pop(websocket, None)

    async def broadcast_event(
        self,
        event_type: str,
        organization_id: str,
        branch_id: str,
        summary: str,
        data: dict[str, Any] | None = None,
        source_user_id: str | None = None,
        source_user_name: str | None = None,
        branch_name: str | None = None,
    ) -> RealtimeEvent:
        """
        Record event in ring buffer and broadcast to authorized subscribers.

        CRITICAL: All broadcast events originate from committed database operations.
        """
        now_iso = datetime.now(UTC).isoformat()
        evt = RealtimeEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            organization_id=organization_id,
            branch_id=branch_id,
            branch_name=branch_name,
            timestamp=now_iso,
            source_user_id=source_user_id,
            source_user_name=source_user_name,
            summary=summary,
            data=data or {},
        )

        # Append to bounded history
        async with self._lock:
            self.event_history.append(evt)
            if len(self.event_history) > self._max_history:
                self.event_history = self.event_history[-self._max_history:]

        # Broadcast to active sockets
        payload = evt.model_dump()
        dead_sockets: list[WebSocket] = []

        for ws, meta in list(self.active_connections.items()):
            # Enforce tenant isolation
            if meta.get("organization_id") != organization_id:
                continue

            # Branch isolation check:
            # - Super Admin / Owner can listen to "all" or specific branch
            # - Branch employees only receive events matching their subscribed/authorized branch
            sub_branch = meta.get("subscribed_branch_id", "all")
            if sub_branch != "all" and sub_branch != branch_id:
                continue

            try:
                await ws.send_json(payload)
            except Exception:
                dead_sockets.append(ws)

        for dead in dead_sockets:
            self.disconnect(dead)

        return evt

    def get_events(
        self,
        organization_id: str,
        branch_id: str | None = None,
        limit: int = 50,
        since_iso: str | None = None,
    ) -> list[RealtimeEvent]:
        """Query recent events for catch-up and polling fallback."""
        matched: list[RealtimeEvent] = []
        for evt in reversed(self.event_history):
            if evt.organization_id != organization_id:
                continue
            if branch_id and branch_id != "all" and evt.branch_id != branch_id:
                continue
            if since_iso and evt.timestamp <= since_iso:
                continue
            matched.append(evt)
            if len(matched) >= limit:
                break
        return list(reversed(matched))


# Global singleton manager
ws_manager = ConnectionManager()


async def authenticate_ws_token(token: str | None) -> dict[str, Any] | None:
    """Validate bearer token from WebSocket query or headers."""
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        if payload.get("role") == "customer" or payload.get("token_scope") == "customer":
            return None
        return {
            "user_id": payload.get("sub"),
            "role": payload.get("role", "staff"),
            "organization_id": payload.get("organization_id"),
            "branch_id": payload.get("active_branch_id") or payload.get("branch_id"),
            "allowed_branches": payload.get("allowed_branches", []),
            "permissions": payload.get("permissions", []),
        }
    except Exception:
        return None
