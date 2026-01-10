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
    
    # Check connectivity based on graph type
    is_connected = False
    if G.number_of_nodes() > 0:
        is_connected = nx.is_weakly_connected(G) if G.is_directed() else nx.is_connected(G)
    
    metadata = {
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
        "density": nx.density(G),
        "is_connected": is_connected,
        "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
        "columns": df.columns
    }
    
    resolved_algorithm = apply_layout(G, algorithm=algorithm)
    graph_data = nx.node_link_data(G, edges="links")
    
    return {
        "metadata": metadata,
        "nodes": graph_data["nodes"],
        "edges": graph_data["links"],
        "format": "csv_processed",
        "algorithm_used": resolved_algorithm
    }


def _process_json_graph_sync(file_path: Path, mapping: dict, algorithm: str = "auto") -> dict:
    """Version synchrone du traitement JSON pour Celery."""
    
    with open(file_path, 'rb') as f:
        content = orjson.loads(f.read())
    
    if isinstance(content, dict) and 'nodes' in content:
        nodes = content['nodes']
        # Support both 'edges' (generic) and 'links' (D3/NetworkX convention)
        edges = content.get('edges', content.get('links'))
        
        if edges is None:
             # Fallback to list check if no edges/links found, or raise logic later
             # But for now, if 'nodes' is present but no edges, it might be a node-only graph?
             # existing code flow expects edges.
             pass

        if edges is not None:
             G = nx.Graph()
             
             for node in nodes:
                 node_id = node.get('id')
                 if node_id:
                     G.add_node(node_id, **{k: v for k, v in node.items() if k != 'id'})
             
             src_col = mapping.get('source') or 'source'
             tgt_col = mapping.get('target') or 'target'
             weight_col = mapping.get('weight') or 'weight'
             
             # Fallback: if user didn't specify mapping and 'weight' not found, try 'value' (common in D3)
             if not mapping.get('weight') and edges and 'value' in edges[0]:
                 weight_col = 'value'
             
             for edge in edges:
                 source = edge.get(src_col)
                 target = edge.get(tgt_col)
                 weight = edge.get(weight_col, 1.0)
                 
                 if source is not None and target is not None and str(source).strip() != "" and str(target).strip() != "":
                     try:
                         w = float(weight) if weight else 1.0
                     except (ValueError, TypeError):
                         w = 1.0
                     G.add_edge(source, target, weight=w)
             
             edge_keys = list(edges[0].keys()) if edges else []

        # Check connectivity based on graph type
        is_connected = False
        if G.number_of_nodes() > 0:
            is_connected = nx.is_weakly_connected(G) if G.is_directed() else nx.is_connected(G)
        
        metadata = {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "density": nx.density(G),
            "is_connected": is_connected,
            "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
            "columns": edge_keys
        }
        
        resolved_algorithm = apply_layout(G, algorithm=algorithm)
        graph_data = nx.node_link_data(G, edges="links")
        
        used_mapping = {
            "source": src_col,
            "target": tgt_col,
            "weight": weight_col
        }
        
        return {
            "metadata": metadata,
            "nodes": graph_data["nodes"],
            "edges": graph_data["links"],
            "format": "json_node_link",
            "algorithm_used": resolved_algorithm,
            "mapping": used_mapping
        }
    
    elif isinstance(content, list):
        # Traiter comme une liste d'edges
        src_col = mapping.get('source') or 'source'
        tgt_col = mapping.get('target') or 'target'
        weight_col = mapping.get('weight') or 'weight'
        
        # If still failing validation because defaults didn't match data, we will raise error later 
        # but here we ensure at least we try defaults.
        if not src_col or not tgt_col:
             # Should practically never happen with defaults set above
            raise ValueError("Les colonnes source et target sont requises")
        
        G = nx.Graph()
        
        for row in content:
            source = row.get(src_col)
            target = row.get(tgt_col)
            weight = row.get(weight_col, 1.0)
            
            if source is not None and target is not None and str(source).strip() != "" and str(target).strip() != "":
                try:
                    w = float(weight) if weight else 1.0
                except (ValueError, TypeError):
                    w = 1.0
                G.add_edge(source, target, weight=w)
        
        edge_keys = list(content[0].keys()) if content else []

        # Check connectivity based on graph type
        is_connected = False
        if G.number_of_nodes() > 0:
            is_connected = nx.is_weakly_connected(G) if G.is_directed() else nx.is_connected(G)
        
        metadata = {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "density": nx.density(G),
            "is_connected": is_connected,
            "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
            "columns": edge_keys
        }
        
        resolved_algorithm = apply_layout(G, algorithm=algorithm)
        graph_data = nx.node_link_data(G, edges="links")
        
        used_mapping = {
            "source": src_col,
            "target": tgt_col,
            "weight": weight_col
        }
        
        return {
            "metadata": metadata,
            "nodes": graph_data["nodes"],
            "edges": graph_data["links"],
            "format": "json_list",
            "algorithm_used": resolved_algorithm,
            "mapping": used_mapping
        }
    
    else:
        raise ValueError("Format JSON non reconnu")


def _process_gexf_graph_sync(file_path: Path, mapping: dict, algorithm: str = "auto") -> dict:
    """Version synchrone du traitement GEXF pour Celery."""
    from io import BytesIO
    import re
    
    def sanitize_xml_content(content: bytes) -> bytes:
        """Nettoie le contenu XML en supprimant les caractères invalides."""
        # Decode with error handling
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text = content.decode('latin1')
            except UnicodeDecodeError:
                text = content.decode('utf-8', errors='ignore')
        
        # Remove invalid XML characters (control characters except whitespace)
        # Valid XML: #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD]
        def is_valid_xml_char(char):
            codepoint = ord(char)
            return (
                codepoint == 0x9 or
                codepoint == 0xA or
                codepoint == 0xD or
                (0x20 <= codepoint <= 0xD7FF) or
                (0xE000 <= codepoint <= 0xFFFD)
            )
        
        cleaned = ''.join(char if is_valid_xml_char(char) else ' ' for char in text)
        return cleaned.encode('utf-8')
    
    try:
        # Try direct parsing first
        G = nx.read_gexf(file_path)
    except Exception as first_error:
        try:
            # Read and sanitize content
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Try version fix first
            if b'version="1.3"' in content:
                content = content.replace(b'version="1.3"', b'version="1.2"')
                content = content.replace(b'http://www.gexf.net/1.3', b'http://www.gexf.net/1.2draft')
            
            # Sanitize XML
            content = sanitize_xml_content(content)
            
            # Try parsing sanitized content
            G = nx.read_gexf(BytesIO(content))
        except Exception as e:
            # Provide more helpful error message
            error_msg = str(first_error) if len(str(first_error)) < 200 else str(e)
            raise ValueError(f"Impossible de lire le fichier GEXF. Le fichier contient des caractères invalides ou un format XML incorrect. Erreur: {error_msg}")
    
    for node, data in G.nodes(data=True):
        for k, v in data.items():
            if isinstance(v, (set, tuple)):
                data[k] = list(v)
                
    # Check connectivity based on graph type
    is_connected = False
    if G.number_of_nodes() > 0:
        is_connected = nx.is_weakly_connected(G) if G.is_directed() else nx.is_connected(G)
    
    metadata = {
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
        "density": nx.density(G),
        "is_connected": is_connected,
        "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
        "columns": []
    }
    
    resolved_algorithm = apply_layout(G, algorithm=algorithm)
    
    graph_data = nx.node_link_data(G, edges="links")
    
    return {
        "metadata": metadata,
        "nodes": graph_data["nodes"],
        "edges": graph_data["links"],
        "format": "gexf",
        "algorithm_used": resolved_algorithm
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
def async_process_graph_file(self, file_path: str, mapping: dict, algorithm: str = "auto", project_id: str = None, is_new_project: bool = True):
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
                    # Utiliser l'algorithme résolu (après "auto") au lieu de l'argument original
                    project.algorithm = result.get("algorithm_used", algorithm)
                    
                    # Si c'était un nouveau projet sans mapping explicite, sauver le mapping utilisé
                    # On priorise le mapping retourné par la fonction de traitement (qui contient les valeurs par défaut utilisées)
                    result_mapping = result.get("mapping")
                    if result_mapping:
                        project.mapping = result_mapping
                    elif not project.mapping and mapping: 
                        project.mapping = mapping
                    
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
        
        # Nettoyage: supprimer le projet UNIQUEMENT si c'est un NOUVEAU projet
        if project_id and is_new_project:
            try:
                mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
                db_name = os.getenv("MONGODB_DB", "pe_def_db")
                client = motor.motor_asyncio.AsyncIOMotorClient(mongo_uri)
                db = client[db_name]
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                async def cleanup_project():
                    await init_beanie(database=db, document_models=[Project])
                    project = await Project.get(project_id)
                    if project:
                        # Supprimer le fichier source si possible
                        if project.source_file_path:
                            try:
                                Path(project.source_file_path).unlink(missing_ok=True)
                            except Exception:
                                pass
                        await project.delete()
                        print(f"Projet {project_id} supprimé après échec du traitement (Nouveau Projet)")
                
                try:
                    loop.run_until_complete(cleanup_project())
                finally:
                    loop.close()
                    client.close()
            except Exception as cleanup_error:
                print(f"Erreur lors du nettoyage du projet: {str(cleanup_error)}")
        else:
             print(f"Echec du traitement pour le projet {project_id} (Non supprimé car existant). Erreur: {e}")
        
        return {"status": "FAILURE", "error": str(e)}

