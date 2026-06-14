from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://todos_user:todos_pass@postgres:5432/todos_app"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "dev-secret-key"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173"
    API_V1_PREFIX: str = "/api/v1"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_DOMAIN: str | None = None
    DEBUG: bool = True
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    OAUTH_REDIRECT_BASE: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3001"
    ENABLE_GITHUB_OAUTH: bool | None = None
    ENABLE_GOOGLE_OAUTH: bool | None = None

    model_config = SettingsConfigDict(env_file=".env")

    @model_validator(mode="after")
    def check_secret_key(self):
        if not self.DEBUG and self.SECRET_KEY == "dev-secret-key":
            raise ValueError("SECRET_KEY must be changed from the default in production")
        return self

    @model_validator(mode="after")
    def init_oauth_flags(self):
        if self.ENABLE_GITHUB_OAUTH is None:
            self.ENABLE_GITHUB_OAUTH = bool(self.GITHUB_CLIENT_ID and self.GITHUB_CLIENT_SECRET)
        if self.ENABLE_GOOGLE_OAUTH is None:
            self.ENABLE_GOOGLE_OAUTH = bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)
        return self


settings = Settings()
