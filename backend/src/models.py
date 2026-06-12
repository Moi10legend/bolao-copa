from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship

class GroupMember(SQLModel, table=True):
    group_id: int = Field(foreign_key="group.id", primary_key=True)
    user_id: int = Field(foreign_key="user.id", primary_key=True)

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    groups: list["Group"] = Relationship(back_populates="members", link_model=GroupMember)
    match_guesses: list["MatchGuess"] = Relationship(back_populates="user")
    tournament_guesses: list["TournamentGuess"] = Relationship(back_populates="user")

class Group(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    code: str | None = Field(unique=True, index=True)
    creator_id: int | None = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    members: list[User] = Relationship(back_populates="groups", link_model=GroupMember)

class Match(SQLModel, table=True):
    id: int = Field(primary_key=True)
    team_a: str
    team_b: str
    match_date: datetime
    status: str = Field(default="scheduled")
    score_a: int | None
    score_b: int | None

class MatchGuess(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    match_id: int = Field(foreign_key="match.id")
    guess_a: int
    guess_b: int
    points_earned: int = Field(default=0)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    user: User = Relationship(back_populates="match_guesses")

class TournamentGuess(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    champion: str
    top_scorer: str  
    top_assists: str 
    best_defense: str
    best_attack: str
    brazil_stage: str 
    points_earned: int = Field(default=0)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    
    user: User = Relationship(back_populates="tournament_guesses")