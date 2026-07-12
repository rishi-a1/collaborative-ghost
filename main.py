from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import uuid
from typing import List, Annotated
import models
from utils import create_unique_join_code
from database import engine, SessionLocal
from sqlalchemy.orm import Session
from sqlalchemy import select

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

# Makes the following requests in an interpretable format for sqlalchemy and fastapi
class JoinRequest(BaseModel):
    join_code: str

class TurnRequest(BaseModel):
    turn_prompt: str
    author_name: str
    room_id : uuid.UUID

# function to generate the AI response using the prompt
def get_ai_response(prompt):
    a = "ai resp"
    return str(a)

# Starts a db session for an sql request
def get_db() :
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function used to create a room and add it to the db
@app.post("/create")
async def create_room(db: Session = Depends(get_db)):
    code = create_unique_join_code(db)
    room = models.Room(join_code=code)
    db.add(room)
    db.commit()
    db.refresh(room)
    return {"room_id": room.id, "join_code": room.join_code, "created_at": room.created_at}

# Using post to make someone join a room
# Using JoinRequest class for payload to make sure the payload is in JSON format
# Using dependency injection to initiate database session for sql request
@app.post("/join")
async def join_room(payload: JoinRequest, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.join_code == payload.join_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"room_id": room.id}

# Using this as a tester function for now
@app.get("/rooms")
async def get_rooms(db : Session = Depends(get_db), response_model=List[models.RoomOut]):
    statement = select(models.Room)
    result = db.execute(statement)
    return result.scalars().all()

#getting the room from the room id (uuid format) in the url
@app.get("/rooms/{room_id}")
async def get_room(room_id: uuid.UUID, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"room_id": room.id, "join_code": room.join_code, "created_at": room.created_at}

@app.post("/rooms/{room_id}")
async def add_turn(room_id: uuid.UUID, turn: TurnRequest, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    else:
        turn_db = TurnRequest(turn_prompt=get_ai_response(turn.turn_prompt), author_name=turn.author_name, room_id = room_id)
        db.add(turn_db)
        db.commit()
        db.refresh(turn_db)
        return {"id": turn_db.id, "created_at": turn_db.created_at, "room_id": turn_db.room_id, "prompt": turn_db.turn_prompt, "author_name": turn_db.author_name}
