"""
Gestion de la connexion MongoDB avec Motor (driver async).
Configuration du client MongoDB et initialisation de Beanie ODM.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from core.config import settings
from typing import Optional


class MongoDB:
    """
    Gestionnaire de connexion MongoDB singleton.
    
    Maintient la connexion au serveur MongoDB et fournit l'accès
    à la base de données configurée.
    """
    
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect(cls):
        """
        Établit la connexion à MongoDB et initialise Beanie.
        
        Doit être appelé au démarrage de l'application.
        Configure le client Motor et initialise les modèles Beanie.
        """
        cls.client = AsyncIOMotorClient(settings.MONGODB_URI)
        
        from models.user import User
        
        await init_beanie(
            database=cls.client[settings.DATABASE_NAME],
            document_models=[User]
        )
    
    @classmethod
    async def close(cls):
        """
        Ferme la connexion MongoDB proprement.
        
        Doit être appelé à l'arrêt de l'application.
        """
        if cls.client:
            cls.client.close()
