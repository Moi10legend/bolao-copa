from fastapi import FastAPI
from src.core.db import init_db
from contextlib import asynccontextmanager
from src.api.v1.api import api_router
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Bolão copa do mundo 2026", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Na produção, substitua o "*" pela URL do seu frontend na Vercel
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)