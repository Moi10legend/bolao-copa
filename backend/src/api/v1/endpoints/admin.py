import httpx
from fastapi import APIRouter, Depends
from sqlmodel import select, SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

from src.core.db import get_session
from src.models import Match
# Importando o motor que acabamos de criar
from src.services.points_engine import process_match_results

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin"])

API_URL = "https://v3.football.api-sports.io/fixtures?league=1&season=2026"
API_HEADERS = {
    "x-rapidapi-host": "v3.football.api-sports.io",
    "x-rapidapi-key": os.getenv("API_SPORTS_KEY")
}

@router.post("/sync-matches")
async def sync_matches(session: AsyncSession = Depends(get_session)):
    async with httpx.AsyncClient() as client:
        response = await client.get(API_URL, headers=API_HEADERS)
        
        if response.status_code != 200:
            return {"error": f"Falha de rede. HTTP {response.status_code}", "detalhes": response.text}
            
        data = response.json()
        
        # 🕵️ A MÁGICA AQUI: Checando os erros escondidos da API-Sports
        if data.get("errors"):
            return {"error": "A API-Sports bloqueou a requisição!", "detalhes": data["errors"]}
            
        fixtures = data.get("response", [])
        
        if not fixtures:
            return {"error": "A requisição deu certo, mas a lista de jogos veio vazia da API.", "data": data}
            
        processed_games = 0
        total_imported = 0 # Contador para sabermos quantos jogos foram pro banco

        for item in fixtures:
            fixture_id = item["fixture"]["id"]
            status_api = item["fixture"]["status"]["short"].lower()
            
            query = select(Match).where(Match.id == fixture_id)
            result = await session.exec(query)
            existing_match = result.first()
            
            # Formata a data
            date_str = item["fixture"]["date"].replace("Z", "+00:00")
            match_date = datetime.fromisoformat(date_str).astimezone(timezone.utc)
            
            if not existing_match:
                new_match = Match(
                    id=fixture_id,
                    team_a=item["teams"]["home"]["name"],
                    team_b=item["teams"]["away"]["name"],
                    match_date=match_date,
                    status=status_api,
                    score_a=item["goals"]["home"],
                    score_b=item["goals"]["away"]
                )
                session.add(new_match)
                await session.commit()
            else:
                existing_match.status = status_api
                existing_match.score_a = item["goals"]["home"]
                existing_match.score_b = item["goals"]["away"]
                session.add(existing_match)
                await session.commit()
            
            total_imported += 1 # Conta mais um jogo salvo/atualizado

            # O GATILHO DO MOTOR
            if status_api in ["ft", "aet", "pen", "finished"]:
                await process_match_results(fixture_id, session)
                processed_games += 1
                
        return {
            "message": "Sincronização concluída com sucesso!",
            "jogos_salvos_no_banco": total_imported,
            "jogos_finalizados_calculados": processed_games
        }
    


class MatchResultInput(SQLModel):
    score_a: int
    score_b: int

@router.put("/update-match/{match_id}")
async def update_match_and_calc_points(
    match_id: int, 
    result: MatchResultInput, 
    session: AsyncSession = Depends(get_session)
):
    # 1. Busca o jogo no banco
    query = select(Match).where(Match.id == match_id)
    db_result = await session.exec(query)
    match = db_result.first()
    
    if not match:
        return {"error": "Jogo não encontrado!"}
        
    # 2. Atualiza o placar e o status para finalizado
    match.score_a = result.score_a
    match.score_b = result.score_b
    match.status = "ft"
    session.add(match)
    await session.commit()
    
    # 3. RODA O MOTOR DE PONTOS!
    await process_match_results(match_id, session)
    
    return {"message": f"Jogo {match_id} atualizado e pontos calculados com sucesso!"}