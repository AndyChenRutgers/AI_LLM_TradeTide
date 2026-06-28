from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # app settings
    APP_ENV: str = "development"
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # database settings
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/trade_tide"

    # redis settings
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 300

    # LLM Provider Settings
    OPENAI_API_KEY: str = <OPENAI_API_KEY>
    ANTHROPIC_API_KEY: str = <ANTHROPIC_API_KEY>
    GOOGLE_API_KEY: str = <GOOGLE_API_KEY>

    # Market Data Settings
    FINNHUB_API_KEY: str = <FINNHUB_API_KEY>
    ALPACA_API_KEY: str = <ALPACA_API_KEY>
    ALPACA_SECRET_KEY: str = <ALPACA_SECRET_KEY>
    POLYGON_API_KEY: str = <POLYGON_API_KEY>
    NEWS_API_KEY: str = <NEWS_API_KEY>
    TWITTER_API_KEY: str = <TWITTER_API_KEY>

    # agent behavior settings
    MAX_AGENT_ITERATIONS: int = 10
    DEFAULT_LLM_PROVIDER: str = "google"
    DEFAULT_MODEL: str = "gemini-3.1-flash-lite-preview"
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: int = 1024

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()