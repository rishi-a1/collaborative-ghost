from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from typing import List, Annotated
import models
from utils import create_unique_join_code
from utils import generate_story_turn
from database import engine, SessionLocal
from sqlalchemy.orm import Session
from sqlalchemy import select
import os
from dotenv import load_dotenv

app = FastAPI()
models.Base.metadata.create_all(bind=engine)

FRONTEND_URL = os.getenv("FRONTEND_URL")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # React dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

# Makes the following requests in an interpretable format for sqlalchemy and fastapi
class JoinRequest(BaseModel):
    player_name: str
    join_code: str

class MaxPlayers(BaseModel):
    PlayerName: str
    MaxPlayers: int

class TurnRequest(BaseModel):
    turn_prompt: str
    author_name: str
    player_index: int
    room_id : uuid.UUID


class LeaveRequest(BaseModel):
    player_name: str

# Starts a db session for an sql request
def get_db() :
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function used to create a room and add it to the db
@app.post("/create")
async def create_room(payload: MaxPlayers, db: Session = Depends(get_db)):
    code = create_unique_join_code(db)
    room = models.Room(join_code=code, max_players=payload.MaxPlayers, players=[payload.PlayerName], current_turn=0)
    db.add(room)
    db.commit()
    db.refresh(room)
    return {"room_id": room.id, "join_code": room.join_code, "created_at": room.created_at, "player_index": 0}

# Using post to make someone join a room
# Using JoinRequest class for payload to make sure the payload is in JSON format
# Using dependency injection to initiate database session for sql request
@app.post("/join")
async def join_room(payload: JoinRequest, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.join_code == payload.join_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if len(room.players) == room.max_players:
        return {"error" : "room full"}
    player_index = len(room.players)
    room.players = room.players + [payload.player_name]
    db.add(room)
    db.commit()
    db.refresh(room)
    return {"room_id": room.id, "player_index": player_index}

# Using this as a tester function for now
@app.get("/rooms")
async def get_rooms(db : Session = Depends(get_db), response_model=List[models.RoomOut]):
    statement = select(models.Room)
    result = db.execute(statement)
    return result.scalars().all()

#getting the room from the room id (uuid format) in the url
@app.get("/rooms/{room_id}/turns")
async def get_room(room_id: uuid.UUID, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"room_id": room.id, "join_code": room.join_code, "created_at": room.created_at}

# function to add a turn once in a room
@app.post("/rooms/{room_id}")
async def add_turn(room_id: uuid.UUID, turn: TurnRequest, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if not room.players:
        raise HTTPException(status_code=400, detail="Room has no players")

    if room.current_turn != turn.player_index:
        raise HTTPException(status_code=403, detail="It's not your turn")

    prior_turns = db.query(models.Turn).filter(models.Turn.room_id == room_id).order_by(models.Turn.created_at).all()
    story_so_far = "\n".join(t.content for t in prior_turns)

    ai_content = generate_story_turn(story_so_far, turn.turn_prompt)

    turn_db = models.Turn(
        room_id=room_id,
        author_name=turn.author_name,
        player_index=turn.player_index,
        prompt=turn.turn_prompt,
        content=ai_content,
    )
    db.add(turn_db)

    room.current_turn = (room.current_turn + 1) % len(room.players)
    db.add(room)

    db.commit()
    db.refresh(turn_db)
    return {"id": turn_db.id, "created_at": turn_db.created_at, "room_id": turn_db.room_id, "prompt": turn_db.prompt, "content": turn_db.content, "author_name": turn_db.author_name}

# function to get all turns in the room, plus whose turn it currently is
@app.get("/rooms/{room_id}")
async def get_turns(room_id: uuid.UUID, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    turn_query = db.query(models.Turn).filter(models.Turn.room_id == room_id).order_by(models.Turn.created_at)
    result = db.execute(turn_query)
    turns = result.scalars().all()

    return {
        "turns": turns,
        "current_turn": room.current_turn,
        "players": room.players,
        "max_players": room.max_players,
    }

# function to remove a player from a room, deleting the room + its turns if it's now empty
@app.post("/rooms/{room_id}/leave")
async def leave_room(room_id: uuid.UUID, payload: LeaveRequest, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if payload.player_name not in room.players:
        return {"deleted": False, "players": room.players, "current_turn": room.current_turn}

    leaving_index = room.players.index(payload.player_name)
    room.players = [p for p in room.players if p != payload.player_name]

    if len(room.players) == 0:
        db.query(models.Turn).filter(models.Turn.room_id == room_id).delete()
        db.delete(room)
        db.commit()
        return {"deleted": True}

    if leaving_index < room.current_turn:
        room.current_turn -= 1
    room.current_turn = room.current_turn % len(room.players)

    db.add(room)
    db.commit()
    return {"deleted": False, "players": room.players, "current_turn": room.current_turn}