from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from src.core.security import verify_password, create_access_token
from src.core.db import get_session
from datetime import timedelta 
from src.models import User
# Importe suas funções de banco e segurança aqui...

router = APIRouter()

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    session: AsyncSession = Depends(get_session)
):
    # 1. Busca o usuário pelo email (form_data.username guarda o email neste caso)
    query = select(User).where(User.email == form_data.username)
    result = await session.exec(query)
    user = result.first()

    # 2. Verifica se o usuário existe e se a senha bate com o Argon2
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=400, 
            detail="Email ou senha incorretos"
        )

    # 3. Gera o token JWT válido por 7 dias
    access_token_expires = timedelta(hours=2)
    access_token = create_access_token(
        data={"sub": str(user.id)}, # O "sub" (subject) guarda o ID do usuário
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}