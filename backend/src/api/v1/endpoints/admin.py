import httpx
from fastapi import APIRouter, Depends
from sqlmodel import select
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
            return {"error": "Falha ao buscar dados da API externa"}
            
        data = response.json()
        fixtures = data.get("response", [])
        
        processed_games = 0

        for item in fixtures:
            fixture_id = item["fixture"]["id"]
            status_api = item["fixture"]["status"]["short"].lower()
            
            query = select(Match).where(Match.id == fixture_id)
            result = await session.exec(query)
            existing_match = result.first()
            
            # Formata a data (usando o padrão atualizado)
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

            # O GATILHO DO MOTOR: Se o jogo acabou de ser atualizado como "finished", calcula os pontos!
            if status_api in ["ft", "aet", "pen", "finished"]:
                await process_match_results(fixture_id, session)
                processed_games += 1
                
        return {"message": f"Sincronização concluída. {processed_games} jogos finalizados tiveram seus pontos calculados."}