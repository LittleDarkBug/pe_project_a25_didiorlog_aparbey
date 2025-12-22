"""
Tâches Celery pour le traitement asynchrone des graphes.
"""

import sys
import os
# Ensure /app is in path for module resolution
if "/app" not in sys.path:
    sys.path.insert(0, "/app")

from celery_app import celery_app
from models.project import Project
from beanie import init_beanie
import motor.motor_asyncio
import os
from pathlib import Path
import asyncio
import networkx as nx
import polars as pl
import orjson
from datetime import datetime, timezone
from services.graph_service import apply_layout


def _read_csv_safe(file_path: Path, n_rows: int = None) -> pl.DataFrame:
    """Tente de lire un CSV avec plusieurs encodages et séparateurs."""
    encodings = ['utf8', 'latin1', 'cp1252', 'iso-8859-1']
    separators = [',', ';', '\t', '|']
    
    best_df = None
    last_error = None
    
    for encoding in encodings:
        for separator in separators:
            try:
                df = pl.read_csv(file_path, n_rows=n_rows, encoding=encoding, separator=separator)
                if len(df.columns) > 1:
                    return df
                if best_df is None:
                    best_df = df
            except Exception as e:
                last_error = e
                continue
            
    if best_df is not None:
        return best_df
            
    raise ValueError(f"Impossible de lire le fichier CSV. Dernière erreur: {str(last_error)}")


def _process_csv_graph_sync(file_path: Path, mapping: dict, algorithm: str = "auto") -> dict:
    """Version synchrone du traitement CSV pour Celery."""
    
    df = _read_csv_safe(file_path)
    
    src_col = mapping.get('source')
    tgt_col = mapping.get('target')
    weight_col = mapping.get('weight')
    
    if not src_col or not tgt_col:
        raise ValueError("Les colonnes source et target sont requises")
    
    G = nx.Graph()
    
    for row in df.iter_rows(named=True):
        source = row[src_col]
        target = row[tgt_col]
        
        weight = 1.0
        if weight_col and weight_col in row:
            val = row[weight_col]
            if val is not None and str(val).strip() != "":
                try:
                    weight = float(val)
                except (ValueError, TypeError):
                    weight = 1.0
        
        if source is not None and target is not None and str(source).strip() != "" and str(target).strip() != "":
            G.add_edge(source, target, weight=weight)
    
    metadata = {
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
        "density": nx.density(G),
        "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
        "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
        "columns": df.columns
    }
    
    apply_layout(G, algorithm=algorithm)
    graph_data = nx.node_link_data(G)
    
    return {
        "metadata": metadata,
        "nodes": graph_data["nodes"],
        "edges": graph_data["links"],
        "format": "csv_processed"
    }


def _process_json_graph_sync(file_path: Path, mapping: dict, algorithm: str = "auto") -> dict:
    """Version synchrone du traitement JSON pour Celery."""
    
    with open(file_path, 'rb') as f:
        content = orjson.loads(f.read())
    
    if isinstance(content, dict) and 'nodes' in content and 'edges' in content:
        nodes = content['nodes']
        edges = content['edges']
        
        G = nx.Graph()
        
        for node in nodes:
            node_id = node.get('id')
            if node_id:
                G.add_node(node_id, **{k: v for k, v in node.items() if k != 'id'})
        
        src_col = mapping.get('source', 'source')
        tgt_col = mapping.get('target', 'target')
        weight_col = mapping.get('weight', 'weight')
        
        for edge in edges:
            source = edge.get(src_col)
            target = edge.get(tgt_col)
            weight = edge.get(weight_col, 1.0)
            
            if source is not None and target is not None and str(source).strip() != "" and str(target).strip() != "":
                G.add_edge(source, target, weight=float(weight) if weight else 1.0)
        
        edge_keys = list(edges[0].keys()) if edges else []

        metadata = {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "density": nx.density(G),
            "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
            "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
            "columns": edge_keys
        }
        
        apply_layout(G, algorithm=algorithm)
        graph_data = nx.node_link_data(G)
        
        return {
            "metadata": metadata,
            "nodes": graph_data["nodes"],
            "edges": graph_data["links"],
            "format": "json_node_link"
        }
    
    elif isinstance(content, list):
        # Traiter comme une liste d'edges
        src_col = mapping.get('source')
        tgt_col = mapping.get('target')
        weight_col = mapping.get('weight')
        
        if not src_col or not tgt_col:
            raise ValueError("Les colonnes source et target sont requises")
        
        G = nx.Graph()
        
        for row in content:
            source = row.get(src_col)
            target = row.get(tgt_col)
            weight = row.get(weight_col, 1.0)
            
            if source is not None and target is not None and str(source).strip() != "" and str(target).strip() != "":
                G.add_edge(source, target, weight=float(weight) if weight else 1.0)
        
        edge_keys = list(content[0].keys()) if content else []

        metadata = {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "density": nx.density(G),
            "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
            "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
            "columns": edge_keys
        }
        
        apply_layout(G, algorithm=algorithm)
        graph_data = nx.node_link_data(G)
        
        return {
            "metadata": metadata,
            "nodes": graph_data["nodes"],
            "edges": graph_data["links"],
            "format": "json_list"
        }
    
    else:
        raise ValueError("Format JSON non reconnu")


def _process_gexf_graph_sync(file_path: Path, mapping: dict, algorithm: str = "auto") -> dict:
    """Version synchrone du traitement GEXF pour Celery."""
    from io import BytesIO
    
    try:
        G = nx.read_gexf(file_path)
    except Exception:
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            if b'version="1.3"' in content:
                content = content.replace(b'version="1.3"', b'version="1.2"')
                content = content.replace(b'http://www.gexf.net/1.3', b'http://www.gexf.net/1.2draft')
                G = nx.read_gexf(BytesIO(content))
            else:
                raise
        except Exception as e:
            raise ValueError(f"Impossible de lire le fichier GEXF: {str(e)}")
    
    for node, data in G.nodes(data=True):
        for k, v in data.items():
            if isinstance(v, (set, tuple)):
                data[k] = list(v)
                
    metadata = {
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
        "density": nx.density(G),
        "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
        "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
        "columns": []
    }
    
    apply_layout(G, algorithm=algorithm)
    graph_data = nx.node_link_data(G)
    
    return {
        "metadata": metadata,
        "nodes": graph_data["nodes"],
        "edges": graph_data["links"],
        "format": "gexf"
    }


def process_graph_file_sync(file_path: Path, mapping: dict, algorithm: str = "auto") -> dict:
    """
    Traite un fichier de graphe de façon SYNCHRONE (pour Celery workers).
    """
    file_ext = file_path.suffix.lower()
    
    if file_ext == '.csv':
        return _process_csv_graph_sync(file_path, mapping, algorithm)
    elif file_ext == '.json':
        return _process_json_graph_sync(file_path, mapping, algorithm)
    elif file_ext == '.gexf':
        return _process_gexf_graph_sync(file_path, mapping, algorithm)
    else:
        raise ValueError(f"Format de fichier non supporté: {file_ext}")


@celery_app.task(bind=True, name="tasks.async_process_graph_file")
def async_process_graph_file(self, file_path: str, mapping: dict, algorithm: str = "auto", project_id: str = None):
    """
    Tâche Celery pour traiter un graphe volumineux de façon asynchrone 
    et sauvegarder le résultat dans le projet.
    """
    try:
        abs_path = Path(file_path)
        
        # Traitement synchrone du graphe
        result = process_graph_file_sync(abs_path, mapping, algorithm)
        
        # Persistance automatique du résultat dans le projet
        if project_id:
            mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            db_name = os.getenv("MONGODB_DB", "pe_def_db")
            client = motor.motor_asyncio.AsyncIOMotorClient(mongo_uri)
            db = client[db_name]
            
            # Créer un nouveau event loop pour les opérations async
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def update_project():
                await init_beanie(database=db, document_models=[Project])
                project = await Project.get(project_id)
                if project:
                    project.graph_data = result
                    project.metadata = result.get("metadata", {})
                    project.updated_at = datetime.now(timezone.utc)
                    await project.save()
            
            try:
                loop.run_until_complete(update_project())
            finally:
                loop.close()
                client.close()
        
        return {"status": "SUCCESS", "result": result}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "FAILURE", "error": str(e)}
