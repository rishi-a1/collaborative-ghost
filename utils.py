from sqlalchemy.orm import Session
from models import Room
import random
import string
from groq import Groq
import os
from dotenv import load_dotenv


def generate_join_code(length: int = 6):
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))

def create_unique_join_code(db: Session):
    while True:
        code = generate_join_code()
        exists = db.query(Room).filter(Room.join_code == code).first()
        if not exists:
            return code

client = Groq(api_key="your_free_api_key")

def generate_story_turn(story_so_far: str, player_prompt: str) -> str:
    load_dotenv()
    my_api_key = os.getenv("API_KEY")
    client = Groq(api_key=my_api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are continuing a collaborative story. Write 2-3 sentences continuing it based on the player's instruction. Return only the story text, no commentary."},
            {"role": "user", "content": f"Story so far:\n{story_so_far}\n\nPlayer's instruction: {player_prompt}"},
        ],
    )
    return response.choices[0].message.content