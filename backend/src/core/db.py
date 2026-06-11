from sqlmodel import create_engine, SQLModel, Session
import os

DATABASE_URL = "postgresql+asyncpg://admin:bolaosecretpass@localhost:5432/bolao_db"

engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    # Isso cria todas as tabelas no banco se elas não existirem
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session