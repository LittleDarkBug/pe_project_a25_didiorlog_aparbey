from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from pathlib import Path
import uuid
import json
import shutil
from datetime import datetime, timezone
from beanie import PydanticObjectId

from models.user import User
from models.project import Project
from api.dependencies import get_current_user
from services.graph_service import process_graph_file
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

router = APIRouter(prefix="/projects", tags=["Projects"])

class ProjectCreate(BaseModel):
    name: str
    temp_file_id: str
    mapping: Dict[str, str]

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    temp_file_id: Optional[str] = None
    mapping: Optional[Dict[str, str]] = None

class LayoutUpdate(BaseModel):
    algorithm: str

@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_project(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    is_public: bool = Form(False),
    mapping: Optional[str] = Form(None),
    algorithm: str = Form("auto"),
    current_user: User = Depends(get_current_user)
):
    """
    Crée un nouveau projet à partir d'un fichier uploadé et d'un mapping.
    """
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    # Générer un nom de fichier unique pour éviter les collisions
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename
    
    try:
        # Sauvegarder le fichier
        file.file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parser le mapping
        parsed_mapping = {}
        if mapping:
            try:
                parsed_mapping = json.loads(mapping)
            except json.JSONDecodeError:
                # Si c'est vide ou null, on garde {}
                if mapping.strip() and mapping != "null":
                    raise HTTPException(status_code=400, detail="Format de mapping invalide")

        # 1. Traiter le graphe
        graph_data = await process_graph_file(
            file_path,
            mapping=parsed_mapping,
            algorithm=algorithm
        )
        
        # 2. Créer le projet en BDD
        project = Project(
            name=name,
            description=description,
            owner=current_user,
            graph_data=graph_data,  # On stocke tout le graphe (nodes/edges)
            metadata=graph_data.get("metadata", {}),
            mapping=parsed_mapping,
            source_file_path=str(file_path),
            is_public=is_public
        )
        
        await project.insert()
        
        response_data = {
            "id": str(project.id),
            "name": project.name,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "metadata": project.metadata or {},
            "graph_data": project.graph_data or {},
            "mapping": project.mapping or {},
            "message": "Projet créé avec succès"
        }
        return clean_nans(response_data)
        
    except Exception as e:
        # Clean up file if error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du projet: {str(e)}")

@router.post("/{project_id}/layout", response_model=Dict[str, Any])
async def update_project_layout(
    project_id: str,
    layout_update: LayoutUpdate,
    current_user: User = Depends(get_current_user)
):
    """Recalcule le layout du graphe."""
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if project.owner.ref.id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    if not project.source_file_path:
        raise HTTPException(status_code=400, detail="Fichier source manquant")
        
    file_path = Path(project.source_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier source introuvable sur le disque")

    try:
        # Recalculer le graphe avec le nouvel algorithme
        graph_data = await process_graph_file(
            file_path,
            mapping=project.mapping or {},
            algorithm=layout_update.algorithm
        )
        
        project.graph_data = graph_data
        project.metadata = graph_data.get("metadata", {})
        project.updated_at = datetime.now(timezone.utc)
        
        await project.save()
        
        return clean_nans({
            "message": "Layout mis à jour",
            "graph_data": project.graph_data
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du recalcul du layout: {str(e)}")


@router.put("/{project_id}", response_model=Dict[str, Any])
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_user)
):
    """Met à jour un projet (nom, fichier ou mapping)."""
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    if project.owner.ref.id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    # Update name
    if project_update.name:
        project.name = project_update.name

    # Handle file/mapping update
    if project_update.temp_file_id or project_update.mapping:
        file_path = None
        
        # Case 1: New file provided
        if project_update.temp_file_id:
            upload_dir = Path("uploads")
            safe_filename = Path(project_update.temp_file_id).name
            file_path = upload_dir / safe_filename
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="Nouveau fichier introuvable")
            project.source_file_path = str(file_path)
            
        # Case 2: No new file, use existing
        elif project.source_file_path:
            file_path = Path(project.source_file_path)
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="Fichier source original introuvable")
        
        # If we have a file to process
        if file_path and project_update.mapping:
            try:
                graph_data = await process_graph_file(
                    file_path,
                    mapping=project_update.mapping
                )
                project.graph_data = graph_data
                project.metadata = graph_data.get("metadata", {})
                project.mapping = project_update.mapping  # Save the new mapping
                project.updated_at = datetime.now(timezone.utc)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du graphe: {str(e)}")

    await project.save()
    
    response_data = {
        "id": str(project.id),
        "name": project.name,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "metadata": project.metadata or {},
        "graph_data": project.graph_data or {},
        "mapping": project.mapping or {},
        "message": "Projet mis à jour avec succès"
    }
    return clean_nans(response_data)

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
            "updated_at": project.updated_at,
            "metadata": project.metadata or {},
            "graph_data": project.graph_data or {},
            "mapping": project.mapping or {}
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
