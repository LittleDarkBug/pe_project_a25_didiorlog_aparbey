"""
Schémas Pydantic pour les requêtes et réponses d'authentification.
Définit la structure des données échangées via l'API.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class RegisterRequest(BaseModel):
    """
    Données requises pour l'inscription d'un nouvel utilisateur.
    """
    
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePassword123!",
                "full_name": "John Doe"
            }
        }


class LoginRequest(BaseModel):
    """
    Données requises pour la connexion d'un utilisateur.
    """
    
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePassword123!"
            }
        }


class TokenResponse(BaseModel):
    """
    Réponse contenant les tokens JWT après authentification réussie.
    """
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        }


class RefreshRequest(BaseModel):
    """
    Données requises pour rafraîchir un access token.
    """
    
    refresh_token: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class TokenData(BaseModel):
    """
    Données extraites d'un token JWT décodé.
    """
    
    user_id: Optional[str] = None
    email: Optional[str] = None
    token_type: Optional[str] = None


class UserUpdate(BaseModel):
    """
    Données pour la mise à jour du profil utilisateur.
    """
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Jane Doe",
                "email": "jane@example.com"
            }
        }


class UserResponse(BaseModel):
    """
    Représentation publique d'un utilisateur dans les réponses API.
    """
    
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    role: str = "user"
    created_at: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "email": "user@example.com",
                "full_name": "John Doe",
                "is_active": True,
                "role": "user",
                "created_at": "2025-01-15T10:30:00Z"
            }
        }
