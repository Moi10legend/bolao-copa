from fastapi import APIRouter, Depends, HTTPException
# Importe os modelos Group, GroupMember, a sessão do banco e o get_current_use
from src.models import Group, GroupMember, User, MatchGuess
from src.core.db import get_session
from src.core.security import get_current_user
from src.api.v1.endpoints.users import generate_group_code
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func

router = APIRouter(prefix="/groups", tags=["Groups"])

@router.post("/create")
async def create_group(
    name: str, 
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Gera um código único para o grupo
    unique_code = generate_group_code()
    
    # Cria o grupo vinculando ao usuário logado como criador
    new_group = Group(
        name=name,
        code=unique_code,
        creator_id=current_user.id
    )
    
    session.add(new_group)
    await session.commit()
    await session.refresh(new_group)
    
    # Adiciona o criador automaticamente como membro do grupo
    group_member = GroupMember(group_id=new_group.id, user_id=current_user.id)
    session.add(group_member)
    await session.commit()
    
    return {"message": "Grupo criado com sucesso!", "group": new_group}

@router.post("/join/{code}")
async def join_group(
    code: str, 
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Busca o grupo pelo código de convite
    query = select(Group).where(Group.code == code.upper())
    result = await session.exec(query)
    group = result.first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado.")
        
    # Verifica se o usuário já está no grupo
    member_query = select(GroupMember).where(
        (GroupMember.group_id == group.id) & 
        (GroupMember.user_id == current_user.id)
    )
    member_result = await session.exec(member_query)
    
    if member_result.first():
        raise HTTPException(status_code=400, detail="Você já faz parte deste grupo.")
        
    # Adiciona o usuário ao grupo
    new_member = GroupMember(group_id=group.id, user_id=current_user.id)
    session.add(new_member)
    await session.commit()
    
    return {"message": f"Você entrou no grupo {group.name}!"}

@router.get("/{group_id}/ranking")
async def get_group_ranking(
    group_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Retorna o ranking do grupo, calculando a soma dos pontos dos jogos em tempo real.
    """
    # 1. Verifica se o grupo existe
    query_group = select(Group).where(Group.id == group_id)
    result_group = await session.exec(query_group)
    group = result_group.first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado.")

    # 2. (Opcional, mas recomendado) Verifica se o usuário logado faz parte do grupo
    query_member = select(GroupMember).where(
        (GroupMember.group_id == group_id) & 
        (GroupMember.user_id == current_user.id)
    )
    result_member = await session.exec(query_member)
    if not result_member.first():
        raise HTTPException(status_code=403, detail="Você não tem permissão para ver o ranking deste grupo.")

    # 3. A Mágica do Banco Relacional: Busca os usuários do grupo e soma os pontos
    # Usamos outerjoin no MatchGuess para que usuários sem palpites ainda apareçam com 0 pontos
    query_ranking = (
        select(
            User.id,
            User.name,
            func.coalesce(func.sum(MatchGuess.points_earned), 0).label("total_points")
        )
        .join(GroupMember, GroupMember.user_id == User.id)
        .outerjoin(MatchGuess, MatchGuess.user_id == User.id)
        .where(GroupMember.group_id == group_id)
        .group_by(User.id, User.name)
        .order_by(func.sum(MatchGuess.points_earned).desc())
    )
    
    result_ranking = await session.exec(query_ranking)
    ranking_data = result_ranking.all()

    # Formata a resposta para o frontend
    ranking = [
        {"user_id": row.id, "name": row.name, "points": row.total_points}
        for row in ranking_data
    ]

    return {"group_name": group.name, "ranking": ranking}