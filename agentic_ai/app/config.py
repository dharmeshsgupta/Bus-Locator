from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    GROK_API_KEY: str

    DATABASE_URL: str

    REDIS_HOST:str
    REDIS_PORT: str

    # Microservice Endpoint URLs
    AUTH_SERVICE_URL: str
    TRANSPORT_SERVICE_URL: str
    TRACKING_SERVICE_URL: str

    # Add these two lines around line 10
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"

    BUS_SERVICE_URL: str

    WEATHER_API_KEY:str

    DEBUG: bool = True

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    model_config = SettingsConfigDict(
        env_file="app/.env",   # <-- Point to the folder where you created the .env file
        extra="ignore"
    )


settings = Settings()