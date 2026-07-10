from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Annotated
import models
from utils import create_unique_join_code
from database import engine, SessionLocal
from sqlalchemy.orm import Session

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

# Makes the join code in an interpretable json format for fastapi and sqlalchemy
class JoinRequest(BaseModel):
    join_code: str

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

# Using post to make someone join a room for future proofing
@app.post("/join")
async def join_room(payload: JoinRequest, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.join_code == payload.join_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"room_id": room.id}

# @app.post("/rooms/")
# async def post_turn():
#     return