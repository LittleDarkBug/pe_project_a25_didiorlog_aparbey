"""
Dépendances réutilisables pour l'injection dans les routes FastAPI.
Gère l'authentification et la récupération de l'utilisateur courant.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from core.security import decode_token
from core.redis_client import RedisClient
from models.user import User
from schemas.auth import TokenData


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Extrait et valide le token JWT, puis récupère l'utilisateur depuis MongoDB.
    
    Vérifications effectuées:
    1. Token JWT valide et non expiré
    2. Token non blacklisté dans Redis
    3. Type de token = 'access'
    4. Utilisateur existe dans MongoDB
    5. Utilisateur est actif
    
    Args:
        credentials: Credentials HTTP Bearer extraites du header Authorization
        
    Returns:
        Instance User de l'utilisateur authentifié
        
    Raises:
        HTTPException: 401 si le token est invalide ou l'utilisateur n'existe pas
    """
    token = credentials.credentials
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    is_blacklisted = await RedisClient.is_token_blacklisted(token)
    if is_blacklisted:
        raise credentials_exception
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = await User.get(user_id)
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Vérifie que l'utilisateur courant est un superuser.
    
    Utilise get_current_user comme dépendance, puis vérifie is_superuser.
    
    Args:
        current_user: Utilisateur authentifié via get_current_user
        
    Returns:
        Instance User si superuser
        
    Raises:
        HTTPException: 403 si l'utilisateur n'est pas superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough privileges"
        )
    return current_user
