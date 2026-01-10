"""
Service de traitement de graphes.
"""

import polars as pl
import orjson
import networkx as nx
import igraph as ig
from typing import Dict, Any, List
from pathlib import Path
import asyncio

def _read_csv_safe(file_path: Path, n_rows: int = None) -> pl.DataFrame:
    """Tente de lire un CSV avec plusieurs encodages et séparateurs."""
    encodings = ['utf8', 'latin1', 'cp1252', 'iso-8859-1']
    separators = [',', ';', '\t', '|']
    
    best_df = None
    last_error = None
    
    for encoding in encodings:
        for separator in separators:
            try:
                # On lit le CSV
                df = pl.read_csv(file_path, n_rows=n_rows, encoding=encoding, separator=separator)
                
                # Si on a plus d'une colonne, c'est probablement le bon séparateur
                if len(df.columns) > 1:
                    return df
                
                # Si on a une seule colonne, on le garde de côté au cas où
                if best_df is None:
                    best_df = df
                    
            except Exception as e:
                last_error = e
                continue
            
    if best_df is not None:
        return best_df
            
    raise ValueError(f"Impossible de lire le fichier CSV. Dernier erreur: {str(last_error)}")

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
            df = _read_csv_safe(file_path, n_rows=1000)
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
                            "suggestions": _suggest_mapping(edge_keys) or {
                                "source": "source",
                                "target": "target",
                                "format": "json_node_link_default"
                            },
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
        elif file_ext == '.gexf':
            try:
                try:
                    G = nx.read_gexf(file_path)
                except Exception:
                    # Fallback pour GEXF 1.3
                    with open(file_path, 'rb') as f:
                        content = f.read()
                    if b'version="1.3"' in content:
                        content = content.replace(b'version="1.3"', b'version="1.2"')
                        content = content.replace(b'http://www.gexf.net/1.3', b'http://www.gexf.net/1.2draft')
                        from io import BytesIO
                        G = nx.read_gexf(BytesIO(content))
                    else:
                        raise

                result = {
                    "type": "gexf",
                    "columns": [],
                    "preview": [],
                    "suggestions": {
                        "source": "id",
                        "target": "target",
                        "format": "gexf_standard"
                    },
                    "stats": {
                        "node_count": G.number_of_nodes(),
                        "edge_count": G.number_of_edges(),
                        "density": round(nx.density(G), 4),
                        "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False
                    }
                }
            except Exception as e:
                raise ValueError(f"Erreur lecture GEXF: {str(e)}")
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
    
    # Mots-clés pour la source (étendus)
    source_keywords = [
        'source', 'src', 'from', 'start', 'u', 'origin', 
        'author', 'sender', 'user', 'initiator', 'subject'
    ]
    for candidate in source_keywords:
        if candidate in cols_lower:
            mapping['source'] = cols_lower[candidate]
            break
            
    # Mots-clés pour la cible (étendus)
    target_keywords = [
        'target', 'tgt', 'to', 'end', 'v', 'dest', 'destination',
        'receiver', 'recipient', 'reply_to', 'mentioned', 'object', 'interaction'
    ]
    for candidate in target_keywords:
        if candidate in cols_lower:
            mapping['target'] = cols_lower[candidate]
            break
            
    # Mots-clés pour le poids
    weight_keywords = ['weight', 'poids', 'value', 'score', 'w', 'count', 'strength']
    for candidate in weight_keywords:
        if candidate in cols_lower:
            mapping['weight'] = cols_lower[candidate]
            break
            
    return mapping


async def process_graph_file(
    file_path: Path,
    mapping: Dict[str, str],
    algorithm: str = "auto"
) -> Dict[str, Any]:
    """
    Traite un fichier de graphe (CSV ou JSON) en fonction du mapping fourni.
    
    Args:
        file_path: Chemin du fichier
        mapping: Dictionnaire de mapping (source, target, weight)
        algorithm: Algorithme de spatialisation (auto, spring, circular, random, shell, spectral)
        
    Returns:
        Graphe au format JSON compatible avec la visualisation 3D
    """
    file_ext = file_path.suffix.lower()
    
    try:
        if file_ext == '.csv':
            return await asyncio.to_thread(_process_csv_graph, file_path, mapping, algorithm)
        elif file_ext == '.json':
            return await asyncio.to_thread(_process_json_graph, file_path, mapping, algorithm)
        elif file_ext == '.gexf':
            return await asyncio.to_thread(_process_gexf_graph, file_path, mapping, algorithm)
        else:
            raise ValueError(f"Format de fichier non supporté: {file_ext}")
    except Exception as e:
        raise ValueError(f"Erreur traitement graphe: {str(e)}")


def _process_csv_graph(file_path: Path, mapping: Dict[str, str], algorithm: str = "auto") -> Dict[str, Any]:
    """Traite un fichier CSV pour créer un graphe."""
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
        
        # Ignorer les lignes avec des valeurs manquantes ou vides
        if source is not None and target is not None and str(source).strip() != "" and str(target).strip() != "":
            # Capture extra attributes for valid edge
            edge_attrs = {k: v for k, v in row.items() if k not in [src_col, tgt_col, weight_col]}
            G.add_edge(source, target, weight=weight, **edge_attrs)
    
    metadata = {
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
        "density": nx.density(G),
        "is_connected": nx.is_connected(G),
        "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
        "columns": df.columns
    }
    
    # Calcul du layout 3D
    resolved_algorithm = apply_layout(G, algorithm=algorithm)
    
    # Explicitly use 'links' to preserve compatibility with existing frontend logic
    graph_data = nx.node_link_data(G, edges="links")
    
    return {
        "metadata": metadata,
        "nodes": graph_data["nodes"],
        "edges": graph_data["links"],
        "format": "csv_processed",
        "algorithm_used": resolved_algorithm
    }


def _process_json_graph(file_path: Path, mapping: Dict[str, str], algorithm: str = "auto") -> Dict[str, Any]:
    """Traite un fichier JSON pour créer un graphe."""
    with open(file_path, 'rb') as f:
        content = orjson.loads(f.read())
    
    if isinstance(content, dict) and 'nodes' in content:
        nodes = content['nodes']
        # Support both 'edges' (generic) and 'links' (D3/NetworkX convention)
        edges = content.get('edges', content.get('links'))
        
        if edges is not None:
             G = nx.Graph()
             
             for node in nodes:
                 node_id = node.get('id')
                 if node_id:
                     G.add_node(node_id, **{k: v for k, v in node.items() if k != 'id'})
             
             src_col = mapping.get('source') or 'source'
             tgt_col = mapping.get('target') or 'target'
             weight_col = mapping.get('weight') or 'weight'
             
             # Fallback: if user didn't specify mapping (ImportWizard defaults) and 'weight' not found, try 'value' (Common in D3)
             if not mapping.get('weight') and edges and 'value' in edges[0]:
                 weight_col = 'value'
             
             for edge in edges:
                 source = edge.get(src_col)
                 target = edge.get(tgt_col)
                 weight = edge.get(weight_col, 1.0)
                 
                 # Ignorer les lignes avec des valeurs manquantes ou vides
                 if source is not None and target is not None and str(source).strip() != "" and str(target).strip() != "":
                     try:
                        w = float(weight) if weight else 1.0
                     except (ValueError, TypeError):
                        w = 1.0
                     # Capture extra attributes for valid edge
                     edge_attrs = {k: v for k, v in edge.items() if k not in [src_col, tgt_col, weight_col]}
                     G.add_edge(source, target, weight=w, **edge_attrs)
        
        edge_keys = list(edges[0].keys()) if edges and len(edges) > 0 else []

        metadata = {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "density": nx.density(G),
            "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
            "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
            "columns": edge_keys
        }
        
        # Calcul du layout 3D
        resolved_algorithm = apply_layout(G, algorithm=algorithm)
        
        graph_data = nx.node_link_data(G, edges="links")
        
        return {
            "metadata": metadata,
            "nodes": graph_data["nodes"],
            "edges": graph_data["links"],
            "format": "json_node_link",
            "algorithm_used": resolved_algorithm
        }
    
    elif isinstance(content, list):
        return _process_csv_graph_from_list(content, mapping)
    
    else:
        raise ValueError("Format JSON non reconnu. Utilisez le format node-link {nodes: [...], edges: [...]}")


def _process_csv_graph_from_list(data: List[Dict], mapping: Dict[str, str], algorithm: str = "auto") -> Dict[str, Any]:
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
        
        # Ignorer les lignes avec des valeurs manquantes ou vides
        if source is not None and target is not None and str(source).strip() != "" and str(target).strip() != "":
            edge_attrs = {k: v for k, v in row.items() if k not in [src_col, tgt_col, weight_col]}
            G.add_edge(source, target, weight=float(weight) if weight else 1.0, **edge_attrs)
    
    edge_keys = list(data[0].keys()) if data and len(data) > 0 else []

    metadata = {
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
        "density": nx.density(G),
        "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
        "avg_degree": sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
        "columns": edge_keys
    }
    
    # Calcul du layout 3D
    resolved_algorithm = apply_layout(G, algorithm=algorithm)
    
    graph_data = nx.node_link_data(G)
    
    return {
        "metadata": metadata,
        "nodes": graph_data["nodes"],
        "edges": graph_data["links"],
        "format": "json_list",
        "algorithm_used": resolved_algorithm
    }


def _process_gexf_graph(file_path: Path, mapping: Dict[str, str], algorithm: str = "auto") -> Dict[str, Any]:
    """Traite un fichier GEXF pour créer un graphe."""
    # Tentative de lecture directe
    try:
        G = nx.read_gexf(file_path)
    except Exception:
        # Si échec (ex: version 1.3 non supportée), on tente de patcher le contenu
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Patch simple pour GEXF 1.3 -> 1.2
            if b'version="1.3"' in content:
                content = content.replace(b'version="1.3"', b'version="1.2"')
                content = content.replace(b'http://www.gexf.net/1.3', b'http://www.gexf.net/1.2draft')
                
                from io import BytesIO
                G = nx.read_gexf(BytesIO(content))
            else:
                raise # Relancer l'erreur originale si ce n'est pas la version 1.3
        except Exception as e:
            raise ValueError(f"Impossible de lire le fichier GEXF: {str(e)}")
    
    # Nettoyage et conversion des attributs pour JSON
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
    
    # Calcul du layout 3D
    resolved_algorithm = apply_layout(G, algorithm=algorithm)
    
    graph_data = nx.node_link_data(G, edges="links")
    
    return {
        "metadata": metadata,
        "nodes": graph_data["nodes"],
        "edges": graph_data["links"],
        "format": "gexf",
        "algorithm_used": resolved_algorithm
    }

def apply_layout(G: nx.Graph, algorithm: str = "auto", scale: float = 50.0):
    """
    Applique un algorithme de spatialisation au graphe en utilisant igraph pour la performance et la 3D native.
    Modifie le graphe en place en ajoutant les attributs x, y, z aux nœuds.
    """
    if G.number_of_nodes() == 0:
        return

    # Conversion NetworkX -> iGraph pour la performance
    # On map les IDs de noeuds vers des indices entiers pour igraph
    node_keys = list(G.nodes())
    node_map = {k: i for i, k in enumerate(node_keys)}
    
    # Ensure weights are floats for layout algorithms
    cleaned_edges = []
    weights = []
    for u, v, d in G.edges(data=True):
        w = d.get('weight', 1.0)
        try:
            w = float(w)
        except (ValueError, TypeError):
            w = 1.0
        cleaned_edges.append((node_map[u], node_map[v]))
        weights.append(w)

    ig_graph = ig.Graph(len(node_keys))
    ig_graph.add_edges(cleaned_edges)
    ig_graph.es['weight'] = weights
    
    # Auto-sélection de l'algorithme basée sur plusieurs critères
    if algorithm == "auto":
        num_nodes = G.number_of_nodes()
        num_edges = G.number_of_edges()
        
        # Calcul de la densité du graphe
        density = nx.density(G) if num_nodes > 0 else 0
        
        # Critère 1: Taille (prioritaire pour performance)
        if num_nodes > 5000:
            # Très grand graphe : DrL obligatoire
            algorithm = "drl"
        elif num_nodes > 2000:
            # Grand graphe : DrL sauf si très sparse
            if density < 0.01:  # Graphe très peu dense
                algorithm = "sphere"  # Sphérique pour visualisation globale
            else:
                algorithm = "drl"
        else:
            # Graphes moyens/petits : critères avancés
            
            # Critère 2: Densité
            if density > 0.3:
                # Graphe dense : Kamada-Kawai préserve mieux la structure
                algorithm = "kamada_kawai"
            elif density < 0.05:
                # Graphe très sparse : pas de structure forte
                if num_nodes < 500:
                    algorithm = "sphere"  # Visualisation globale
                else:
                    algorithm = "fruchterman_reingold"
            else:
                # Densité moyenne : vérifier la modularité
                try:
                    # Détection rapide de communautés pour évaluer la structure
                    ig_test = ig.Graph(num_nodes)
                    ig_test.add_edges([(node_map[u], node_map[v]) for u, v in G.edges()])
                    communities = ig_test.community_multilevel()
                    modularity = communities.modularity
                    
                    # Critère 3: Modularité (structure communautaire)
                    if modularity > 0.4 and len(set(communities.membership)) > 3:
                        # Structure communautaire forte : Force Atlas
                        algorithm = "force_atlas"
                    else:
                        # Pas de communautés claires : Fruchterman-Reingold
                        algorithm = "fruchterman_reingold"
                except:
                    # Fallback si détection échoue
                    algorithm = "fruchterman_reingold"

    layout = None
    
    try:
        # Algorithmes 3D natifs de igraph
        if algorithm == "fruchterman_reingold" or algorithm == "spring":
            layout = ig_graph.layout_fruchterman_reingold_3d()
        elif algorithm == "kamada_kawai":
            layout = ig_graph.layout_kamada_kawai_3d()
        elif algorithm == "drl":
            layout = ig_graph.layout_drl(dim=3)
        elif algorithm == "force_atlas":
            # Force Atlas 2 avec extension 3D
            from fa2_modified import ForceAtlas2
            import numpy as np
            
            # Initialiser Force Atlas 2
            forceatlas2 = ForceAtlas2(
                outboundAttractionDistribution=False,
                linLogMode=False,
                adjustSizes=False,
                edgeWeightInfluence=1.0,
                jitterTolerance=1.0,
                barnesHutOptimize=True,
                barnesHutTheta=1.2,
                scalingRatio=2.0,
                strongGravityMode=False,
                gravity=1.0,
                verbose=False
            )
            
            # Calculer le layout 2D (forceatlas2 retourne un dict {node_id: (x, y)})
            pos_2d = forceatlas2.forceatlas2_networkx_layout(G, pos=None, iterations=2000)
            
            # Étendre à 3D en utilisant la détection de communautés pour l'axe Z
            try:
                communities = ig_graph.community_multilevel()
                membership = communities.membership
            except:
                # Fallback si la détection de communautés échoue
                membership = list(range(len(node_keys)))
            
            # Créer layout 3D
            coords_3d = []
            unique_communities = set(membership)
            z_spacing = 20.0  # Espacement vertical entre communautés
            
            for i, (x, y) in enumerate(pos_2d):
                community_id = membership[i]
                # Z basé sur la communauté + petite variation aléatoire
                z_base = (community_id / max(unique_communities)) * z_spacing if len(unique_communities) > 1 else 0
                z_jitter = np.random.uniform(-2, 2)
                coords_3d.append((x, y, z_base + z_jitter))
            
            layout = coords_3d
        elif algorithm == "random":
            layout = ig_graph.layout_random_3d()
        elif algorithm == "sphere":
            layout = ig_graph.layout_sphere() # Sphérique 3D
        elif algorithm == "grid":
            layout = ig_graph.layout_grid_3d()
        else:
            # Fallback sur Fruchterman Reingold 3D
            layout = ig_graph.layout_fruchterman_reingold_3d()
            
        # Application des positions normalisées
        # igraph retourne une liste de tuples (x, y, z)
        
        # Normalisation manuelle pour s'assurer que ça rentre dans l'échelle
        coords = list(layout)
        xs = [c[0] for c in coords]
        ys = [c[1] for c in coords]
        zs = [c[2] for c in coords]
        
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        min_z, max_z = min(zs), max(zs)
        
        range_x = max_x - min_x if max_x != min_x else 1
        range_y = max_y - min_y if max_y != min_y else 1
        range_z = max_z - min_z if max_z != min_z else 1
        
        for i, (x, y, z) in enumerate(coords):
            node_id = node_keys[i]
            
            # Normalisation entre -0.5 et 0.5 puis mise à l'échelle
            norm_x = (x - min_x) / range_x - 0.5
            norm_y = (y - min_y) / range_y - 0.5
            norm_z = (z - min_z) / range_z - 0.5
            
            G.nodes[node_id]['x'] = float(norm_x * scale * 2)
            G.nodes[node_id]['y'] = float(norm_y * scale * 2)
            G.nodes[node_id]['z'] = float(norm_z * scale * 2)
            
    except Exception as e:
        print(f"Erreur layout igraph {algorithm}: {e}. Fallback to NetworkX random.")
        # Fallback ultime si igraph échoue
        pos = nx.random_layout(G, dim=3)
        for node_id, (x, y, z) in pos.items():
            G.nodes[node_id]['x'] = float(x) * scale
            G.nodes[node_id]['y'] = float(y) * scale
            G.nodes[node_id]['z'] = float(z) * scale
        algorithm = "random"  # En cas d'erreur, on a utilisé random
    
    # Retourner l'algorithme effectivement utilisé (après résolution de "auto")
    return algorithm

