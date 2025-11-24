"""
Fonctions de sécurité pour le hashing de mots de passe et la gestion des tokens JWT.
Utilise Argon2id pour le hashing et PyJWT pour les tokens.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError
import jwt
from core.config import settings


ph = PasswordHasher(
    time_cost=settings.ARGON2_TIME_COST,
    memory_cost=settings.ARGON2_MEMORY_COST,
    parallelism=settings.ARGON2_PARALLELISM,
    hash_len=32,
    salt_len=16,
    type=Type.ID
)


def hash_password(password: str) -> str:
    """
    Hash un mot de passe avec Argon2id.
    
    Utilise les paramètres configurés pour équilibrer sécurité et performance.
    Le hash résultant contient tous les paramètres nécessaires à la vérification.
    
    Args:
        password: Mot de passe en clair à hasher
        
    Returns:
        Hash Argon2id au format standard (contient salt et paramètres)
    """
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie qu'un mot de passe correspond à son hash Argon2id.
    
    Args:
        plain_password: Mot de passe en clair à vérifier
        hashed_password: Hash Argon2id stocké en base
        
    Returns:
        True si le mot de passe correspond, False sinon
    """
    try:
        ph.verify(hashed_password, plain_password)
        
        if ph.check_needs_rehash(hashed_password):
            pass
        
        return True
    except VerifyMismatchError:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un token JWT d'accès avec expiration courte.
    
    Le token contient les claims fournis plus l'expiration.
    Typiquement utilisé pour 15-30 minutes.
    
    Args:
        data: Claims à inclure dans le token (ex: {"sub": user_id})
        expires_delta: Durée de validité personnalisée, sinon utilise la config
        
    Returns:
        Token JWT encodé en string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un token JWT de rafraîchissement avec expiration longue.
    
    Le refresh token permet d'obtenir de nouveaux access tokens.
    Typiquement valide 7-30 jours et stocké dans Redis pour révocation.
    
    Args:
        data: Claims à inclure dans le token (ex: {"sub": user_id})
        expires_delta: Durée de validité personnalisée, sinon utilise la config
        
    Returns:
        Token JWT encodé en string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Décode et valide un token JWT.
    
    Vérifie la signature, l'expiration et la structure du token.
    
    Args:
        token: Token JWT à décoder
        
    Returns:
        Payload du token si valide, None sinon
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
