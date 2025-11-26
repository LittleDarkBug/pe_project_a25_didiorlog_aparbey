from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
from pathlib import Path
import uuid
from beanie import PydanticObjectId

from models.user import User
from models.project import Project
from api.dependencies import get_current_user
from services.graph_service import process_graph_file

router = APIRouter(prefix="/projects", tags=["Projects"])

class ProjectCreate(BaseModel):
    name: str
    temp_file_id: str
    mapping: Dict[str, str]

@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Crée un nouveau projet à partir d'un fichier temporaire et d'un mapping.
    """
    upload_dir = Path("uploads")
    # Sécurisation basique du chemin
    safe_filename = Path(project_in.temp_file_id).name
    file_path = upload_dir / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable ou expiré")
        
    try:
        # 1. Traiter le graphe
        graph_data = await process_graph_file(
            file_path,
            mapping=project_in.mapping
        )
        
        # 2. Créer le projet en BDD
        project = Project(
            name=project_in.name,
            owner=current_user,
            graph_data=graph_data,  # On stocke tout le graphe (nodes/edges)
            metadata=graph_data.get("metadata", {}),
            is_public=False
        )
        
        await project.insert()
        
        return {
            "id": str(project.id),
            "name": project.name,
            "stats": project.metadata,
            "message": "Projet créé avec succès"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du projet: {str(e)}")

@router.get("/", response_model=List[Dict[str, Any]])
async def list_projects(current_user: User = Depends(get_current_user)):
    """Liste les projets de l'utilisateur."""
    projects = await Project.find(Project.owner.id == current_user.id).sort(-Project.created_at).to_list()
    
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "created_at": p.created_at,
            "stats": {
                "nodes": (p.metadata or {}).get("node_count", 0),
                "edges": (p.metadata or {}).get("edge_count", 0)
            }
        }
        for p in projects
    ]

import math

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

@router.get("/{project_id}", response_model=Dict[str, Any])
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Récupère un projet par son ID."""
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if project.owner.ref.id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
        
    try:
        response_data = {
            "id": str(project.id),
            "name": project.name,
            "created_at": project.created_at,
            "metadata": project.metadata or {},
            "graph_data": project.graph_data or {}
        }
        return clean_nans(response_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Supprime un projet."""
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if project.owner.ref.id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
        
    await project.delete()
    return None
