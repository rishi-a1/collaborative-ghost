from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Annotated
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

def get_db() :
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/")
async def root():
    return {"message": "Hello World"}
