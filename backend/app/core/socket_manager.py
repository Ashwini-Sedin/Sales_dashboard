import socketio

sio = socketio.AsyncServer(
  async_mode='asgi',
  cors_allowed_origins='*'
)

class SocketManager:

  async def emit_to_lead_room(self, lead_id: str, event: str, data: dict):
    """Emit event to all clients watching a specific lead"""
    await sio.emit(event, data, room=f"lead:{lead_id}")

  async def emit_to_user_room(self, user_id: str, event: str, data: dict):
    """Emit event to a specific user across all their tabs"""
    await sio.emit(event, data, room=f"user:{user_id}")

socket_manager = SocketManager()
