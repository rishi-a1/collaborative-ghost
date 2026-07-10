from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv
import os

#Getting the database url from the .env
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(os.path.dirname(current_dir), ".env")
load_dotenv(dotenv_path=env_path)
db_url = os.getenv("DB_URL")

engine = create_engine(db_url)
Sessionlocal = sessionmaker(autocommit=False, autoflush = False, bind=engine)
Base = declarative_base()
