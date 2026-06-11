from sqlmodel import SQLModel

class User_Create(SQLModel):
    name: str
    email: str
    password: str

class TournamentGuessUpdate(SQLModel):
    champion: str
    top_scorer: str
    top_assists: str
    best_defense: str
    best_attack: str
    brazil_stage: str