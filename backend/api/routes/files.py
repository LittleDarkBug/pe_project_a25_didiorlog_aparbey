"""
Routes pour l'upload de fichiers.
TODO: Traitement des graphes à implémenter.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from pathlib import Path
import aiofiles
from typing import Dict, Any
import uuid

from models.user import User
from api.dependencies import get_current_user
from core.config import settings


router = APIRouter(prefix="/files", tags=["Files"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


async def save_upload_file(upload_file: UploadFile) -> Path:
    """
    Sauvegarde un fichier uploadé sur le disque de manière asynchrone.
    
    Génère un nom unique pour éviter les collisions.
    
    Args:
        upload_file: Fichier uploadé par l'utilisateur
        
    Returns:
        Chemin du fichier sauvegardé
    """
    file_id = str(uuid.uuid4())
    file_extension = Path(upload_file.filename).suffix
    file_path = UPLOAD_DIR / f"{file_id}{file_extension}"
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await upload_file.read()
        await out_file.write(content)
    
    return file_path


@router.post("/upload")
async def upload_graph_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Upload un fichier CSV.
    
    TODO: Implémenter le traitement des graphes.
    
    Args:
        file: Fichier CSV uploadé
        current_user: Utilisateur authentifié
        
    Returns:
        Confirmation d'upload
        
    Raises:
        HTTPException: 400 si le fichier est invalide ou trop gros
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported"
        )
    
    file_size = 0
    chunk_size = 1024 * 1024
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    
    temp_content = bytearray()
    while chunk := await file.read(chunk_size):
        file_size += len(chunk)
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit"
            )
        temp_content.extend(chunk)
    
    await file.seek(0)
    
    file_path = await save_upload_file(file)
    
    try:
        return {
            "success": True,
            "graph_id": str(uuid.uuid4()),
            "filename": file.filename,
            "message": "File uploaded successfully. Graph processing not yet implemented."
        }
    
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )


@router.get("/graphs/{graph_id}")
async def get_graph(
    graph_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Récupère un graphe par son identifiant.
    
    TODO: Implémenter stockage et récupération MongoDB.
    
    Args:
        graph_id: Identifiant unique du graphe
        current_user: Utilisateur authentifié
        
    Returns:
        Données du graphe
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not yet implemented"
    )

