from datetime import datetime, timezone
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models import Match, MatchGuess

# Constantes de Pontuação (Fica fácil de alterar depois se quiser)
POINTS_EXACT_SCORE = 5      # Cravou o placar (ex: apostou 2x1, deu 2x1)
POINTS_CORRECT_OUTCOME = 3  # Acertou o vencedor/empate, mas errou o número de gols
POINTS_NOTHING = 0

def calculate_match_points(guess_a: int, guess_b: int, score_a: int, score_b: int) -> int:
    """
    Compara o palpite com o resultado real e retorna os pontos.
    """
    # 1. Cravou o placar exato
    if guess_a == score_a and guess_b == score_b:
        return POINTS_EXACT_SCORE
    
    # 2. Acertou que seria empate, mas com placar diferente (ex: apostou 1x1, deu 2x2)
    if (guess_a == guess_b) and (score_a == score_b):
        return POINTS_CORRECT_OUTCOME
        
    # 3. Acertou vitória do Time A
    if (guess_a > guess_b) and (score_a > score_b):
        return POINTS_CORRECT_OUTCOME
        
    # 4. Acertou vitória do Time B
    if (guess_a < guess_b) and (score_a < score_b):
        return POINTS_CORRECT_OUTCOME
        
    # 5. Errou tudo
    return POINTS_NOTHING

async def process_match_results(match_id: int, session: AsyncSession):
    """
    Lê o resultado real de um jogo finalizado e atualiza a pontuação 
    de todos os usuários que palpitaram nele.
    """
    # Busca o jogo para garantir que ele acabou e tem placar
    query_match = select(Match).where(Match.id == match_id)
    result_match = await session.exec(query_match)
    match = result_match.first()

    # 🏆 CORREÇÃO AQUI: Lista de status válidos para jogos encerrados
    CLOSED_STATUSES = ["ft", "aet", "pen", "finished"]

    if not match or match.status not in CLOSED_STATUSES or match.score_a is None or match.score_b is None:
        return {"status": "ignored", "message": "Jogo não finalizado ou sem placar."}

    # Busca todos os palpites feitos para este jogo específico
    query_guesses = select(MatchGuess).where(MatchGuess.match_id == match_id)
    result_guesses = await session.exec(query_guesses)
    guesses = result_guesses.all()

    updated_count = 0

    # Itera sobre cada palpite, calcula os pontos e atualiza no banco
    for guess in guesses:
        pts = calculate_match_points(
            guess_a=guess.guess_a, 
            guess_b=guess.guess_b, 
            score_a=match.score_a, 
            score_b=match.score_b
        )
        
        # Atualiza a pontuação no palpite
        guess.points_earned = pts
        guess.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        session.add(guess)
        updated_count += 1
        
    await session.commit()
    
    return {"status": "success", "message": f"{updated_count} palpites atualizados com sucesso."}