from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship

class GroupMember(SQLModel, table=True):
    grupo_id: int | None = Field(default=None, foreign_key="group.id", primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="user.id", primary_key=True)

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.now(timezone.utc))

class Group(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    code: str | None = Field(unique=True, index=True)
    creator_id: int | None = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.now(timezone.utc))

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
    updated_at: datetime = Field(default_factory=datetime.now(timezone.utc))

    user: User = Relationship(back_populates="match_guesses")

class TournamentGuess(SQLModel, table=True):
    id: int