"""
Modèle Projet Beanie pour MongoDB.
Définit la structure des projets utilisateurs.
"""

from beanie import Document, Link
from pydantic import Field
from datetime import datetime, timezone
from typing import Optional
from .user import User

class Project(Document):
    """
    Document Projet stocké dans MongoDB.
    
    Représente un espace de travail contenant un graphe et ses visualisations.
    Peut être public ou privé.
    """
    
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    owner: Link[User]
    is_public: bool = True
    is_featured: bool = False # Published to Gallery (Elite Only)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    graph_data: Optional[dict] = None
    metadata: Optional[dict] = None
    mapping: Optional[dict] = None
    source_file_path: Optional[str] = None
    algorithm: Optional[str] = "auto"  # Layout algorithm used (auto, fruchterman_reingold, etc.)
    
    class Settings:
        name = "projects"
        indexes = [
            "owner",
            "is_public",
            "is_featured",
            "created_at"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Analyse Réseau Social",
                "description": "Graphe des interactions Twitter",
                "is_public": True
            }
        }
