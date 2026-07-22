import uuid
import datetime
from sqlalchemy import Column, DateTime, String, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel, ConfigDict
from sqlalchemy.sql import func
from database import Base

class Room(Base):
    __tablename__ = "rooms"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    join_code = Column(String, unique=True, index = True)
    players = Column(JSON, default=list)
    current_turn = Column(Integer)
    num_rounds = Column(Integer)
    max_players = Column(Integer)

class Turn(Base):
    __tablename__ = "turns"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    player_index = Column(Integer)
    prompt = Column(String)
    author_name = Column(String)

#mirrors sqlalchemy class using pydantic to make it json
class RoomOut(BaseModel):
    id: uuid.UUID
    join_code: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)