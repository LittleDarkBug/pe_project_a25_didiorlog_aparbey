from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import uuid
from beanie import PydanticObjectId

from models.user import User
from models.project import Project
from models.share_link import ShareLink
from api.dependencies import get_current_user
from services.graph_service import process_graph_file
from pathlib import Path
import math

router = APIRouter(prefix="/share", tags=["Share"])

class ShareLinkCreate(BaseModel):
    project_id: str
    expires_in_days: Optional[int] = 7

class LayoutUpdate(BaseModel):
    algorithm: str

def clean_nans(obj):
    """Remplace les NaN et Inf par 0 pour la sérialisation JSON."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return obj
    elif isinstance(obj, dict):
        return {k: clean_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nans(v) for v in obj]
    return obj

@router.post("/generate", response_model=Dict[str, Any])
async def generate_share_link(
    share_data: ShareLinkCreate,
    current_user: User = Depends(get_current_user)
):
    """Génère un lien de partage public pour un projet."""
    try:
        project = await Project.get(PydanticObjectId(share_data.project_id))
    except:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if project.owner.ref.id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
        
    # Créer le token
    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=share_data.expires_in_days)
    
    share_link = ShareLink(
        token=token,
        project_id=str(project.id),
        created_by=str(current_user.id),
        expires_at=expires_at
    )
    
    await share_link.insert()
    
    return {
        "token": token,
        "expires_at": expires_at,
        "url": f"/share/{token}" # Frontend URL path
    }

@router.get("/{token}", response_model=Dict[str, Any])
async def get_shared_project(token: str):
    """Récupère un projet via son token de partage."""
    share_link = await ShareLink.find_one(ShareLink.token == token)
    
    if not share_link:
        raise HTTPException(status_code=404, detail="Lien de partage invalide")
    
    # Gérer la comparaison de dates (naive vs aware)
    expires_at = share_link.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Lien de partage expiré")
        
    project = await Project.get(share_link.project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    # Structure de réponse identique à get_project
    response_data = {
        "id": str(project.id),
        "name": project.name,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "metadata": project.metadata or {},
        "graph_data": project.graph_data or {},
        "mapping": project.mapping or {},
        "is_shared": True,
        "shared_by": str(share_link.created_by)
    }
    
    return clean_nans(response_data)

@router.post("/{token}/layout", response_model=Dict[str, Any])
async def preview_shared_project_layout(token: str, layout_update: LayoutUpdate):
    """Calcule un layout temporaire pour un projet partagé (sans sauvegarde)."""
    share_link = await ShareLink.find_one(ShareLink.token == token)
    
    if not share_link:
        raise HTTPException(status_code=404, detail="Lien de partage invalide")
    
    # Gérer la comparaison de dates (naive vs aware)
    expires_at = share_link.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Lien de partage expiré")
        
    project = await Project.get(share_link.project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    if not project.source_file_path:
        raise HTTPException(status_code=400, detail="Fichier source manquant")
        
    file_path = Path(project.source_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier source introuvable sur le disque")

    try:
        # Recalculer le graphe avec le nouvel algorithme (SANS SAUVEGARDER)
        graph_data = await process_graph_file(
            file_path,
            mapping=project.mapping or {},
            algorithm=layout_update.algorithm
        )
        
        return clean_nans({"graph_data": graph_data})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul du layout: {str(e)}")
