"""
Service de traitement de graphes.
"""

import polars as pl
import orjson
import networkx as nx
from typing import Dict, Any, List
from pathlib import Path

async def analyze_file_structure(file_path: Path) -> Dict[str, Any]:
    """
    Analyse la structure d'un fichier (CSV ou JSON) pour proposer un mapping
    et valider la cohérence du graphe avec NetworkX.
    
    Args:
        file_path: Chemin du fichier
        
    Returns:
        Dictionnaire contenant les colonnes, preview, suggestions et stats.
    """
    file_ext = file_path.suffix.lower()
    result = {}
    
    try:
        if file_ext == '.csv':
            df = pl.read_csv(file_path, n_rows=1000)
            columns = df.columns
            preview = df.head(5).to_dicts()
            
            suggestions = _suggest_mapping(columns)
            
            result = {
                "type": "csv",
                "columns": columns,
                "preview": preview,
                "suggestions": suggestions,
                "stats": None
            }
            
            if 'source' in suggestions and 'target' in suggestions:
                src_col = suggestions['source']
                tgt_col = suggestions['target']
                result['stats'] = _calculate_graph_stats(df, src_col, tgt_col)

        elif file_ext == '.json':
            with open(file_path, 'rb') as f:
                content = orjson.loads(f.read())
                
            if isinstance(content, list):
                if len(content) > 0:
                    keys = list(content[0].keys())
                    preview = content[:5]
                    suggestions = _suggest_mapping(keys)
                    
                    df = pl.DataFrame(content[:1000])
                    
                    result = {
                        "type": "json_list",
                        "columns": keys,
                        "preview": preview,
                        "suggestions": suggestions,
                        "stats": None
                    }
                    
                    if 'source' in suggestions and 'target' in suggestions:
                        result['stats'] = _calculate_graph_stats(df, suggestions['source'], suggestions['target'])
                        
            elif isinstance(content, dict):
                keys = list(content.keys())
                
                if 'nodes' in content and 'edges' in content:
                    nodes = content.get('nodes', [])
                    edges = content.get('edges', [])
                    
                    if isinstance(nodes, list) and len(nodes) > 0 and isinstance(edges, list) and len(edges) > 0:
                        edge_keys = list(edges[0].keys()) if edges else []
                        
                        result = {
                            "type": "json_node_link",
                            "columns": edge_keys,
                            "preview": edges[:5],
                            "suggestions": _suggest_mapping(edge_keys),
                            "stats": None,
                            "node_count": len(nodes),
                            "edge_count": len(edges)
                        }
                        
                        if 'source' in edge_keys and 'target' in edge_keys:
                            df = pl.DataFrame(edges[:1000])
                            result['stats'] = _calculate_graph_stats(df, 'source', 'target')
                    else:
                        result = {
                            "type": "json_node_link_empty",
                            "columns": [],
                            "keys": keys,
                            "preview": [],
                            "suggestions": {},
                            "stats": None
                        }
                else:
                    result = {
                        "type": "json_object",
                        "columns": [],
                        "keys": keys,
                        "preview": {k: str(v)[:100] + "..." if len(str(v)) > 100 else str(v) for k, v in content.items()},
                        "suggestions": {},
                        "stats": None,
                        "message": "Format JSON non compatible. Utilisez un format CSV, JSON liste, ou node-link (nodes/edges)."
                    }
            else:
                raise ValueError("Format JSON non supporté")
        else:
            raise ValueError(f"Extension non supportée: {file_ext}")
            
        return result

    except Exception as e:
        raise ValueError(f"Erreur lors de l'analyse: {str(e)}")

def _calculate_graph_stats(df: pl.DataFrame, src_col: str, tgt_col: str) -> Dict[str, Any]:
    """Crée un graphe temporaire NetworkX pour calculer des stats."""
    try:
        edges = df.select([src_col, tgt_col]).to_numpy()
        G = nx.from_edgelist(edges)
        
        return {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "density": round(nx.density(G), 4),
            "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
            "sample_size": len(df)
        }
    except Exception:
        return None

def _suggest_mapping(columns: List[str]) -> Dict[str, str]:
    """Suggère un mapping basé sur les noms de colonnes."""
    mapping = {}
    
    cols_lower = {c.lower(): c for c in columns}
    
    for candidate in ['source', 'src', 'from', 'start', 'u']:
        if candidate in cols_lower:
            mapping['source'] = cols_lower[candidate]
            break
            
    for candidate in ['target', 'tgt', 'to', 'end', 'v', 'dest']:
        if candidate in cols_lower:
            mapping['target'] = cols_lower[candidate]
            break
            
    for candidate in ['weight', 'poids', 'value', 'score', 'w']:
        if candidate in cols_lower:
            mapping['weight'] = cols_lower[candidate]
            break
            
    return mapping


async def process_graph_file(
    file_path: Path,
    mapping: Dict[str, str]
) -> Dict[str, Any]:
    """
    Traite un fichier de graphe (CSV ou JSON) en fonction du mapping fourni.
    
    Args:
        file_path: Chemin du fichier
        mapping: Dictionnaire de mapping (source, target, weight)
        
    Returns:
        Graphe au format JSON compatible avec la visualisation 3D
    """
    file_ext = file_path.suffix.lower()
    
    try:
        if file_ext == '.csv':
            return await _process_csv_graph(file_path, mapping)
        elif file_ext == '.json':
            return await _process_json_graph(file_path, mapping)
        else:
            raise ValueError(f"Format de fichier non supporté: {file_ext}")
    except Exception as e:
        raise ValueError(f"Erreur traitement graphe: {str(e)}")


async def _process_csv_graph(file_path: Path, mapping: Dict[str, str]) -> Dict[str, Any]:
    """Traite un fichier CSV pour créer un graphe."""
    df = pl.read_csv(file_path)
    
    src_col = mapping.get('source')
    tgt_col = mapping.get('target')
    weight_col = mapping.get('weight')
    
    if not src_col or not tgt_col:
        raise ValueError("Les colonnes source et target sont requises")
    
    G = nx.Graph()
    
    for row in df.iter_rows(named=True):
        source = row[src_col]
        target = row[tgt_col]
        weight = float(row[weight_col]) if weight_col and weight_col in row else 1.0
        
        G.add_edge(source, target, weight=weight)
    
    metadata = {
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
        "density": nx.density(G),
        "is_connected": nx.is_connected(G),
        "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0
    }
    
    graph_data = nx.node_link_data(G)
    
    return {
        "metadata": metadata,
        "nodes": graph_data["nodes"],
        "edges": graph_data["links"],
        "format": "csv_processed"
    }


async def _process_json_graph(file_path: Path, mapping: Dict[str, str]) -> Dict[str, Any]:
    """Traite un fichier JSON pour créer un graphe."""
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
            
            if source and target:
                G.add_edge(source, target, weight=float(weight) if weight else 1.0)
        
        metadata = {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "density": nx.density(G),
            "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
            "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0
        }
        
        graph_data = nx.node_link_data(G)
        
        return {
            "metadata": metadata,
            "nodes": graph_data["nodes"],
            "edges": graph_data["links"],
            "format": "json_node_link"
        }
    
    elif isinstance(content, list):
        return await _process_csv_graph_from_list(content, mapping)
    
    else:
        raise ValueError("Format JSON non reconnu. Utilisez le format node-link {nodes: [...], edges: [...]}")


async def _process_csv_graph_from_list(data: List[Dict], mapping: Dict[str, str]) -> Dict[str, Any]:
    """Traite une liste d'objets JSON comme des edges."""
    src_col = mapping.get('source')
    tgt_col = mapping.get('target')
    weight_col = mapping.get('weight')
    
    if not src_col or not tgt_col:
        raise ValueError("Les colonnes source et target sont requises")
    
    G = nx.Graph()
    
    for row in data:
        source = row.get(src_col)
        target = row.get(tgt_col)
        weight = row.get(weight_col, 1.0)
        
        if source and target:
            G.add_edge(source, target, weight=float(weight) if weight else 1.0)
    
    metadata = {
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
        "density": nx.density(G),
        "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
        "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0
    }
    
    graph_data = nx.node_link_data(G)
    
    return {
        "metadata": metadata,
        "nodes": graph_data["nodes"],
        "edges": graph_data["links"],
        "format": "json_list"
    }
