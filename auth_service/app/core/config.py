from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    FIREBASE_CREDENTIALS_BASE64: Optional[str] = None

    RAZORPAY_KEY_ID: str = "rzp_test_placeholder"
    RAZORPAY_KEY_SECRET: str = "placeholder_secret"
    RAZORPAY_WEBHOOK_SECRET: str = "placeholder_webhook_secret"


    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

import logging
try:
    url_parts = settings.DATABASE_URL.split("@")
    if len(url_parts) > 1:
        scheme_and_user = url_parts[0].split("://")
        scheme = scheme_and_user[0]
        host = url_parts[1]
        logging.info(f"Loaded DATABASE_URL: {scheme}://***@{host}")
    else:
        logging.info(f"Loaded DATABASE_URL: {settings.DATABASE_URL}")
except Exception:
    logging.warning("Could not log DATABASE_URL")
