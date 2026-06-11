from fastapi import Depends, APIRouter, HTTPException
from src.core.db import get_session
from src.models import User
from src.schemas import User_Create
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.security import get_password_hash
import random
import string

router = APIRouter()

@router.post("/register")
async def create_user(user_in: User_Create, session: AsyncSession = Depends(get_session)):
    try:
        query = select(User).where(User.email == user_in.email)
        result = await session.exec(query)
        existing_user = result.first()

        if existing_user:
            raise HTTPException(status_code=400, detail="Este email já está cadastrado")
        
        user_db = User.model_validate(
            user_in,
            update={"password_hash": get_password_hash(user_in.password)}
        )

        session.add(user_db)
        await session.commit()
        await session.refresh(user_db)

        return user_db
        
    except Exception as e:
        await session.rollback()

        if isinstance(e, HTTPException):
            raise e
        
        print(f"Erro ao criar usuário: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao criar usuário.")
    


def generate_group_code(length=6):
    """Gera um código alfanumérico aleatório em maiúsculas."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))