from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Annotated
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}

import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
app = FastAPI ( )
models. Base.metadata. create_all (bind=engine)
class ChoiceBase (BaseModel):
    choice_text: str 
    is_correct: bool
class QuestionBase (BaseModel):
    question_text: str
    choices: List [ChoiceBase]
def get_db() :
    db = SessionLocal()
    try:
        yield db
    finally:
    db.close()