from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
from pathlib import Path
import uuid

from models.user import User
from api.dependencies import get_current_user
from services.graph_service import process_graph_file

router = APIRouter(prefix="/projects", tags=["Projects"])

class ProjectCreate(BaseModel):
    name: str
    temp_file_id: str
    mapping: Dict[str, str]

@router.post("/")
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Crée un nouveau projet à partir d'un fichier temporaire et d'un mapping.
    """
    # 1. Récupérer le fichier temporaire
    # Note: Dans files.py on a sauvegardé dans uploads/
    # On doit reconstruire le chemin. Attention à la sécurité (path traversal)
    # Ici on suppose que temp_file_id est juste le nom du fichier sécurisé
    
    upload_dir = Path("uploads")
    file_path = upload_dir / project_in.temp_file_id
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable ou expiré")
        
    try:
        # 2. Traiter le graphe
        graph_data = await process_graph_file(
            file_path,
            mapping=project_in.mapping
        )
        
        # 3. Sauvegarder en BDD
        # TODO: Créer modèle Project et Graph dans models/
        # Pour l'instant on mock la sauvegarde
        
        project_id = str(uuid.uuid4())
        
        # On sauvegarde le JSON du graphe sur disque pour l'instant (ou MongoDB GridFS plus tard)
        # graph_path = upload_dir / f"{project_id}.json"
        # ... save json ...
        
        return {
            "id": project_id,
            "name": project_in.name,
            "stats": graph_data["metadata"],
            "message": "Projet créé avec succès"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Nettoyer fichier temporaire ? 
        # Peut-être le garder comme "source" du projet
        pass

@router.get("/")
async def list_projects(current_user: User = Depends(get_current_user)):
    """Liste les projets de l'utilisateur."""
    # TODO: Fetch from DB
    return []
