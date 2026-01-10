"""
Configuration centrale de l'application utilisant Pydantic Settings.
Charge les variables d'environnement depuis .env ou docker-compose.yml
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """
    Paramètres de configuration de l'application.
    Toutes les valeurs doivent être définies via variables d'environnement.
    """
    
    # Application
    APP_NAME: str = "PE_Def_Project Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # MongoDB - Injecté par docker-compose.yml
    MONGODB_URI: str
    DATABASE_NAME: str = "pe_def_db"
    
    # Redis - Injecté par docker-compose.yml
    REDIS_URL: str
    REDIS_DECODE_RESPONSES: bool = True
    
    # JWT - Injecté par docker-compose.yml
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # Upload
    MAX_UPLOAD_SIZE_MB: int = 5000
    
    # Argon2
    ARGON2_TIME_COST: int = 3
    ARGON2_MEMORY_COST: int = 65536
    ARGON2_PARALLELISM: int = 4
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
