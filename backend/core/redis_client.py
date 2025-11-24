"""
Client Redis pour gestion des sessions et cache.
Fournit un wrapper async autour de redis-py avec préfixes pour organisation.
"""

from redis.asyncio import Redis
from core.config import settings
from typing import Optional, Any
import orjson


class RedisClient:
    """
    Gestionnaire de connexion Redis singleton.
    
    Maintient la connexion au serveur Redis et fournit des méthodes
    utilitaires pour les opérations courantes.
    """
    
    client: Optional[Redis] = None
    
    @classmethod
    async def connect(cls):
        """
        Établit la connexion à Redis.
        
        Doit être appelé au démarrage de l'application.
        Configure le client Redis avec hiredis parser pour performance.
        """
        cls.client = Redis.from_url(
            settings.REDIS_URL,
            decode_responses=settings.REDIS_DECODE_RESPONSES,
            encoding="utf-8"
        )
        
        await cls.client.ping()
    
    @classmethod
    async def close(cls):
        """
        Ferme la connexion Redis proprement.
        
        Doit être appelé à l'arrêt de l'application.
        """
        if cls.client:
            await cls.client.close()
    
    @classmethod
    async def set_session(cls, key: str, value: Any, expire: int) -> bool:
        """
        Stocke une valeur dans Redis avec préfixe session et expiration.
        
        Args:
            key: Clé de la session (sera préfixée par 'session:')
            value: Valeur à stocker (sera sérialisée en JSON si dict)
            expire: Durée de vie en secondes
            
        Returns:
            True si succès
        """
        if not cls.client:
            return False
        
        full_key = f"session:{key}"
        
        if isinstance(value, (dict, list)):
            value = orjson.dumps(value).decode()
        
        await cls.client.setex(full_key, expire, value)
        return True
    
    @classmethod
    async def get_session(cls, key: str) -> Optional[Any]:
        """
        Récupère une valeur de session depuis Redis.
        
        Args:
            key: Clé de la session (sans préfixe)
            
        Returns:
            Valeur stockée ou None si inexistante/expirée
        """
        if not cls.client:
            return None
        
        full_key = f"session:{key}"
        value = await cls.client.get(full_key)
        
        if value and isinstance(value, str):
            try:
                return orjson.loads(value)
            except:
                return value
        
        return value
    
    @classmethod
    async def delete_session(cls, key: str) -> bool:
        """
        Supprime une session de Redis.
        
        Args:
            key: Clé de la session (sans préfixe)
            
        Returns:
            True si la clé a été supprimée
        """
        if not cls.client:
            return False
        
        full_key = f"session:{key}"
        result = await cls.client.delete(full_key)
        return result > 0
    
    @classmethod
    async def blacklist_token(cls, token: str, expire: int) -> bool:
        """
        Ajoute un token JWT à la blacklist avec expiration.
        
        Utilisé pour invalider les access tokens lors du logout.
        
        Args:
            token: Token JWT complet à blacklister
            expire: Durée de vie en secondes (doit correspondre à l'expiration du token)
            
        Returns:
            True si succès
        """
        if not cls.client:
            return False
        
        full_key = f"blacklist:{token}"
        await cls.client.setex(full_key, expire, "1")
        return True
    
    @classmethod
    async def is_token_blacklisted(cls, token: str) -> bool:
        """
        Vérifie si un token est blacklisté.
        
        Args:
            token: Token JWT à vérifier
            
        Returns:
            True si le token est blacklisté
        """
        if not cls.client:
            return False
        
        full_key = f"blacklist:{token}"
        result = await cls.client.exists(full_key)
        return result > 0
