from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from datetime import datetime, timezone
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.db import get_session
from src.core.security import get_current_user
from src.models import User, Match, MatchGuess, TournamentGuess
from src.schemas import TournamentGuessUpdate
# Importe os modelos Match, MatchGuess, User, get_current_user e get_session

router = APIRouter(prefix="/guesses", tags=["Guesses"])

@router.post("/match")
async def place_match_guess(
    match_id: int,
    guess_a: int,
    guess_b: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # 1. Verifica se o jogo existe
    query_match = select(Match).where(Match.id == match_id)
    result_match = await session.exec(query_match)
    match = result_match.first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Partida não encontrada.")
        
    # 2. Bloqueia palpite se o jogo já começou ou terminou
    # Usando datetime.utcnow() para bater com o padrão UTC das APIs
    if match.match_date <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="As apostas para este jogo já foram encerradas!"
        )
        
    # 3. Verifica se o usuário já tinha palpitado nesse jogo para atualizar ou criar um novo
    query_guess = select(MatchGuess).where(
        (MatchGuess.match_id == match_id) & 
        (MatchGuess.user_id == current_user.id)
    )
    result_guess = await session.exec(query_guess)
    existing_guess = result_guess.first()
    
    if existing_guess:
        # Atualiza o palpite existente
        existing_guess.guess_a = guess_a
        existing_guess.guess_b = guess_b
        existing_guess.updated_at = datetime.now(timezone.utc)
        session.add(existing_guess)
        message = "Palpite atualizado com sucesso!"
    else:
        # Cria um novo palpite
        new_guess = MatchGuess(
            user_id=current_user.id,
            match_id=match_id,
            guess_a=guess_a,
            guess_b=guess_b
        )
        session.add(new_guess)
        message = "Palpite registrado com sucesso!"
        
    await session.commit()
    return {"message": message}

@router.post("/tournament", status_code=status.HTTP_200_OK)
async def save_tournament_guesses(
    guess_in: TournamentGuessUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Registra ou atualiza os palpites de longo prazo do usuário.
    Bloqueia automaticamente se o primeiro jogo da Copa já tiver começado.
    """
    # 1. Validação do Prazo: Busca a data do primeiro jogo cadastrado no banco
    query_second_match = select(Match).order_by(Match.match_date.asc()).offset(1)
    result_match = await session.exec(query_second_match)
    second_match = result_match.first()

    # Bloqueia se o horário atual for maior ou igual ao início do segundo jogo
    if second_match and datetime.now(timezone.utc) >= second_match.match_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O prazo encerrou! O segundo jogo da Copa já começou."
        )

    # 2. Busca se o usuário já tem um palpite de torneio registrado
    query_exist = select(TournamentGuess).where(TournamentGuess.user_id == current_user.id)
    result_exist = await session.exec(query_exist)
    existing_guess = result_exist.first()

    if existing_guess:
        # Atualiza o palpite existente com os novos dados do frontend
        existing_guess.champion = guess_in.champion
        existing_guess.top_scorer = guess_in.top_scorer
        existing_guess.top_assists = guess_in.top_assists
        existing_guess.best_defense = guess_in.best_defense
        existing_guess.best_attack = guess_in.best_attack
        existing_guess.brazil_stage = guess_in.brazil_stage
        existing_guess.updated_at = datetime.now(timezone.utc)
        
        session.add(existing_guess)
        message = "Palpites do torneio atualizados com sucesso!"
    else:
        # Cria um novo registro do zero
        new_guess = TournamentGuess(
            user_id=current_user.id,
            champion=guess_in.champion,
            top_scorer=guess_in.top_scorer,
            top_assists=guess_in.top_assists,
            best_defense=guess_in.best_defense,
            best_attack=guess_in.best_attack,
            brazil_stage=guess_in.brazil_stage
        )
        session.add(new_guess)
        message = "Palpites do torneio registrados com sucesso!"

    await session.commit()
    return {"message": message}


@router.get("/tournament", status_code=status.HTTP_200_OK)
async def get_my_tournament_guesses(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Retorna os palpites de longo prazo que o usuário logado salvou.
    """
    query = select(TournamentGuess).where(TournamentGuess.user_id == current_user.id)
    result = await session.exec(query)
    guess = result.first()

    if not guess:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Você ainda não fez seus palpites de longo prazo."
        )

    return guess

@router.get("/matches")
async def get_matches_with_my_guesses(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Retorna todos os jogos e o palpite do usuário logado para cada um."""
    # Busca todos os jogos ordenados pela data
    matches = await session.exec(select(Match).order_by(Match.match_date.asc()))
    
    # Busca os palpites do usuário logado
    my_guesses = await session.exec(select(MatchGuess).where(MatchGuess.user_id == current_user.id))
    guesses_dict = {g.match_id: {"guess_a": g.guess_a, "guess_b": g.guess_b} for g in my_guesses.all()}
    
    # Monta a resposta unindo os dados
    result = []
    for match in matches.all():
        result.append({
            "id": match.id,
            "team_a": match.team_a,
            "team_b": match.team_b,
            "match_date": match.match_date.isoformat(),
            "status": match.status,
            "score_a": match.score_a,
            "score_b": match.score_b,
            "my_guess": guesses_dict.get(match.id, None)
        })
        
    return result