"""
Routes API pour la gestion des projets.
Inclut les opérations CRUD et le workflow asynchrone Celery.
"""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from pathlib import Path
import uuid
import json
import shutil
import math
from datetime import datetime, timezone
from beanie import PydanticObjectId
from celery.result import AsyncResult

from models.user import User
from models.project import Project
from api.dependencies import get_current_user
from services.graph_service import process_graph_file, analyze_file_structure
from tasks import async_process_graph_file
from celery_app import celery_app


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


# ===== Endpoint de polling Celery =====
@router.get("/tasks/{job_id}", response_model=Dict[str, Any])
async def get_task_status(job_id: str):
    """
    Permet au frontend de vérifier le statut et le résultat d'une tâche Celery.
    """
    task_result = AsyncResult(job_id, app=celery_app)
    response = {"job_id": job_id, "status": task_result.status}
    
    
    if task_result.status == "SUCCESS":
        result = task_result.result
        
        # Check for internal task failure (caught exception)
        if isinstance(result, dict) and result.get("status") == "FAILURE":
            response["status"] = "FAILURE"
            response["error"] = result.get("error")
        else:
            final_result = result.get("result") if isinstance(result, dict) else result
            response["result"] = clean_nans(final_result)
            
    elif task_result.status == "FAILURE":
        response["error"] = str(task_result.result)
    
    return response


# ===== Create Project =====
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
    Lance une tâche Celery pour traiter le graphe de façon asynchrone.
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
                if mapping.strip() and mapping != "null":
                    raise HTTPException(status_code=400, detail="Format de mapping invalide")
        
        # Si pas de mapping fourni, analyser le fichier pour suggestions auto
        if not parsed_mapping:
            analysis = await analyze_file_structure(file_path)
            parsed_mapping = analysis.get("suggestions", {})

        # Créer le projet en BDD avec un statut "pending"
        project = Project(
            name=name,
            description=description,
            owner=current_user,
            graph_data=None,  # Rempli à la fin du traitement
            metadata=None,
            mapping=parsed_mapping,
            source_file_path=str(file_path),
            is_public=is_public
        )
        await project.insert()

        # Lancer la tâche Celery en passant l'ID du projet
        celery_task = async_process_graph_file.delay(
            str(file_path), 
            parsed_mapping, 
            algorithm, 
            str(project.id)
        )

        # Retourner le job_id au frontend (le front doit poller /tasks/{job_id})
        return {
            "id": str(project.id),
            "project_id": str(project.id),
            "job_id": celery_task.id,
            "status": "PENDING",
            "message": "Traitement du graphe lancé. Veuillez patienter et poller /projects/tasks/{job_id} pour le résultat."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up file if error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du projet: {str(e)}")


# ===== Update Project Layout =====
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

    # Calcul asynchrone via Celery
    try:
        celery_task = async_process_graph_file.delay(
            str(file_path),
            project.mapping or {},
            layout_update.algorithm,
            str(project.id)
        )
        
        # update metadata or timestamp to show "processing"?
        # Le timestamp sera mis à jour par la tâche à la fin, mais on peut marquer le "début"
        project.updated_at = datetime.now(timezone.utc)
        await project.save()
        
        return {
            "job_id": celery_task.id,
            "status": "PENDING",
            "message": "Calcul du layout lancé. Veuillez patienter."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du lancement du calcul: {str(e)}")


# ===== Update Project =====
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

    # Handle file/mapping update (asynchrone via Celery)
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
        
        # Lancer la tâche Celery si on a un fichier et un mapping
        if file_path and project_update.mapping:
            celery_task = async_process_graph_file.delay(
                str(file_path), 
                project_update.mapping, 
                "auto", 
                str(project.id)
            )
            project.mapping = project_update.mapping
            project.updated_at = datetime.now(timezone.utc)
            await project.save()
            
            return {
                "id": str(project.id),
                "project_id": str(project.id),
                "job_id": celery_task.id,
                "status": "PENDING",
                "message": "Traitement du graphe lancé. Veuillez patienter et poller /projects/tasks/{job_id} pour le résultat."
            }

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


# ===== List Projects =====
@router.get("/", response_model=List[Dict[str, Any]])
async def list_projects(current_user: User = Depends(get_current_user)):
    """Liste les projets de l'utilisateur."""
    projects = await Project.find(Project.owner.id == current_user.id).sort(-Project.created_at).to_list()
    
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "created_at": p.created_at,
            "algorithm": p.algorithm or "auto",
            "stats": {
                "nodes": (p.metadata or {}).get("node_count", 0),
                "edges": (p.metadata or {}).get("edge_count", 0)
            }
        }
        for p in projects
    ]


# ===== Get Project by ID =====
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
            "mapping": project.mapping or {},
            "algorithm": project.algorithm or "auto"
        }
        return clean_nans(response_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


# ===== Delete Project =====
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
