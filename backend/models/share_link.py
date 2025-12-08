from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional
import uuid

class ShareLink(Document):
    """
    Modèle représentant un lien de partage public pour un projet.
    """
    token: str = Field(default_factory=lambda: str(uuid.uuid4()), unique=True)
    project_id: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    
    class Settings:
        name = "share_links"
        indexes = [
            "token",
            "project_id"
        ]
