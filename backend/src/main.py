from fastapi import FastAPI
from src.core.db import init_db
from contextlib import asynccontextmanager
from src.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Bolão copa do mundo 2026", lifespan=lifespan)

app.include_router(api_router)