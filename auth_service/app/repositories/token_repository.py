from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.token import RefreshToken
from .base_repository import BaseRepository

class TokenRepository(BaseRepository[RefreshToken]):
    def __init__(self):
        super().__init__(RefreshToken)

    async def get_by_token(self, db: AsyncSession, token: str) -> Optional[RefreshToken]:
        stmt = select(RefreshToken).where(RefreshToken.token == token)
        result = await db.execute(stmt)
        return result.scalars().first()

token_repository = TokenRepository()
