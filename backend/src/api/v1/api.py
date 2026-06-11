from fastapi import APIRouter
from src.api.v1.endpoints import users, auth, groups, guesses, users, admin

api_router = APIRouter()

api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(guesses.router, tags=["guesses"])
api_router.include_router(admin.router, tags=["admin"])