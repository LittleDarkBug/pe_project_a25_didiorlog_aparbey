"""
Modèle utilisateur Beanie pour MongoDB.
Définit la structure et les index pour la collection users.
"""

from beanie import Document
from pydantic import EmailStr, Field
from datetime import datetime, timezone
from typing import Optional


class User(Document):
    """
    Document utilisateur stocké dans MongoDB.
    
    Contient les informations d'authentification et métadonnées.
    Le mot de passe est toujours stocké sous forme hashée avec Argon2.
    """
    
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    
    class Settings:
        name = "users"
        indexes = [
            "email"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "full_name": "John Doe",
                "is_active": True
            }
        }
