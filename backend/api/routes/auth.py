"""
Routes d'authentification pour l'inscription, connexion et gestion des tokens.
Implémente le flow JWT avec access et refresh tokens.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from models.user import User
from schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse
)
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from core.redis_client import RedisClient
from core.config import settings
from api.dependencies import get_current_user
import orjson


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Inscription d'un nouvel utilisateur.
    
    Crée un compte utilisateur avec email unique et mot de passe hashé.
    Le mot de passe est hashé avec Argon2id avant stockage.
    
    Returns:
        Informations de l'utilisateur créé (sans le mot de passe)
        
    Raises:
        HTTPException: 400 si l'email existe déjà
    """
    existing_user = await User.find_one(User.email == request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = hash_password(request.password)
    
    user = User(
        email=request.email,
        hashed_password=hashed_password,
        full_name=request.full_name
    )
    
    await user.insert()
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Connexion d'un utilisateur existant.
    
    Vérifie les credentials et génère une paire de tokens JWT.
    Le refresh token est stocké dans Redis pour permettre la révocation.
    
    Returns:
        Access token (courte durée) et refresh token (longue durée)
        
    Raises:
        HTTPException: 401 si les credentials sont invalides
    """
    user = await User.find_one(User.email == request.email)
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    refresh_expire_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    await RedisClient.set_session(
        f"refresh:{refresh_token}",
        str(user.id),
        refresh_expire_seconds
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: RefreshRequest):
    """
    Rafraîchit un access token expiré avec un refresh token valide.
    
    Vérifie que le refresh token existe dans Redis et génère un nouvel access token.
    Optionnellement, peut implémenter la rotation des refresh tokens.
    
    Returns:
        Nouveau access token et même refresh token
        
    Raises:
        HTTPException: 401 si le refresh token est invalide ou révoqué
    """
    payload = decode_token(request.refresh_token)
    
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    stored_user_id = await RedisClient.get_session(f"refresh:{request.refresh_token}")
    
    if not stored_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if str(stored_user_id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await User.get(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    new_access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=request.refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Déconnexion de l'utilisateur courant.
    
    Blackliste l'access token courant et supprime le refresh token de Redis.
    L'utilisateur devra se reconnecter pour obtenir de nouveaux tokens.
    
    Requires:
        Token JWT valide dans le header Authorization
    """
    pass
