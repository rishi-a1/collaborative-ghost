from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Annotated
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}