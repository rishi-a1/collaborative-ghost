from sqlalchemy.orm import Session
from models import Room
import random
import string

def generate_join_code(length: int = 6):
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))

def create_unique_join_code(db: Session):
    while True:
        code = generate_join_code()
        exists = db.query(Room).filter(Room.join_code == code).first()
        if not exists:
            return code