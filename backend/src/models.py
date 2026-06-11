from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship

class GroupMembers(SQLModel, table=True):
    grupo_id: int | None = Field(default=None, foreign_key="group.id", primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="user.id", primary_key=True)

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.now(timezone.utc))