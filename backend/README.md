# PE_Def_Project Backend

Backend API FastAPI pour spatialisation 3D de graphes avec authentification JWT. Supporte NetworkX et igraph pour calculs performants jusqu'à 100k nœuds.

## Stack Technique

- **FastAPI 0.121.3** - Framework web async
- **Pydantic 2.12.4** - Validation et settings
- **Motor 3.7.0** - Driver MongoDB async
- **Beanie 1.27.0** - ODM MongoDB
- **Redis 7.1.0** - Cache et sessions (avec hiredis)
- **PyJWT 2.9.0** - Tokens JWT
- **Argon2-cffi 23.1.0** - Hashing passwords (OWASP 2025)

### Spatialisation 3D

- **NetworkX 3.5** - Graphes Python, spring_layout 3D
- **igraph 0.11.8** - Bibliothèque C avec bindings Python (precompiled wheels)
  - Fruchterman-Reingold 3D (O(n²) optimisé, 5-20k nœuds)
  - Kamada-Kawai 3D (distance-based, <10k nœuds)
  - DrL (O(n log n), >20k nœuds)
- **NumPy 2.2.0** + **SciPy 1.15.0** - Calculs scientifiques
- **Polars 1.35.2** - Parsing CSV ultra-rapide

### Utils

- **orjson 3.10.12** - Serialization JSON performante
- **Loguru 0.7.3** - Logging structuré
- **aiofiles 24.1.0** - I/O fichiers async

## Installation et Démarrage

### Mode Docker (recommandé)

Le backend est conçu pour fonctionner avec Docker Compose. Voir le `docker-compose.yml` à la racine du projet.

```bash
# Depuis la racine du projet
cd ..

# Créer le fichier .env (contient déjà des valeurs prêtes pour le dev)
cp .env.example .env

# Démarrer tous les services
docker-compose up -d
```

Les variables d'environnement sont injectées automatiquement par `docker-compose.yml` depuis le fichier `.env` :
- `MONGODB_URI` : Connexion MongoDB
- `REDIS_URL` : Connexion Redis
- `JWT_SECRET` : Clé de signature JWT
- `MAX_UPLOAD_SIZE_MB` : Limite d'upload

**Accès :**
- API: <http://localhost:8000>
- Documentation: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

### Mode développement local (sans Docker)

**Prérequis :**
- Python 3.11+
- MongoDB 7+ en cours d'exécution
- Redis 7+ en cours d'exécution

**Installation :**

```bash
# 1. Créer l'environnement virtuel
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Créer le fichier .env (depuis backend/)
copy .env.example .env

# 4. Démarrer le serveur
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Note :** En mode local, vous devez configurer `MONGODB_URI` et `REDIS_URL` dans `.env` pour pointer vers vos instances locales de MongoDB et Redis.

## Architecture

```
backend/
├── core/               # Configuration et utilitaires centraux
│   ├── config.py       # Settings Pydantic
│   ├── security.py     # JWT et Argon2
│   ├── database.py     # MongoDB Motor + Beanie
│   └── redis_client.py # Redis pour sessions et cache
├── models/             # Modèles Beanie (MongoDB)
│   └── user.py         # Modèle utilisateur
├── schemas/            # Schémas Pydantic pour validation
│   └── auth.py         # Schémas d'authentification
├── api/
│   ├── dependencies.py # Dépendances réutilisables
│   └── routes/         # Routes API
│       ├── auth.py     # Endpoints auth
│       └── files.py    # Endpoints upload/graphes
├── services/           # Logique métier
│   └── graph_service.py # Service graphes (TODO: à implémenter)
└── main.py             # Point d'entrée FastAPI
```

## Authentification

### Flow JWT avec Access + Refresh Tokens

1. **POST /auth/register** - Inscription avec hash Argon2id
2. **POST /auth/login** - Génération access token (30min) + refresh token (30j)
3. **POST /auth/refresh** - Rafraîchir access token
4. **POST /auth/logout** - Blacklist token et révocation

### Sécurité

- **Argon2id** - time_cost=3, memory_cost=64MB, parallelism=4
- **JWT HS256** avec clé secrète forte
- **Refresh tokens** dans Redis avec TTL
- **Access tokens** courte durée (30min)

## Endpoints

### Authentification

- `POST /auth/register` - Inscription (avec consentement RGPD)
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchir token
- `POST /auth/logout` - Déconnexion (Blacklist token)
- `POST /auth/forgot-password` - Demande de réinitialisation (TODO)
- `POST /auth/reset-password` - Réinitialisation mot de passe (TODO)

### Utilisateurs & Admin

- `GET /users/me` - Profil utilisateur courant
- `PATCH /users/me` - Mise à jour profil
- `GET /admin/users` - Liste utilisateurs (Admin only)
- `DELETE /admin/users/{id}` - Supprimer utilisateur (Admin only)

### Projets

- `GET /projects` - Liste des projets utilisateur
- `POST /projects` - Créer un projet
- `GET /projects/{id}` - Détails projet (Public ou Owner)
- `PUT /projects/{id}` - Modifier projet
- `DELETE /projects/{id}` - Supprimer projet

### Fichiers

- `POST /files/upload` - Upload CSV/JSON (Analyse colonnes)
- `GET /files/graphs/{graph_id}` - Récupération graphe

### Health

- `GET /` - Informations API
- `GET /health` - Health check

## Documentation API

Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Calcul de Spatialisation 3D

**TODO: À implémenter dans `services/graph_service.py`**

Le service supportera 3 algorithmes selon taille du graphe:

### Algorithmes disponibles

| Algorithme                               | Taille graphe | Complexité      | Usage                               |
| ---------------------------------------- | ------------- | ---------------- | ----------------------------------- |
| **NetworkX spring_layout 3D**      | < 5k nœuds   | O(n²)           | Force-directed simple               |
| **igraph Fruchterman-Reingold 3D** | 5-20k nœuds  | O(n²) optimisé | Force-directed performant           |
| **igraph Kamada-Kawai 3D**         | < 10k nœuds  | O(n²)           | Distance-based, préserve topologie |
| **igraph DrL**                     | > 20k nœuds  | O(n log n)       | Distributed Recursive Layout        |

### Sélection automatique

Par défaut, l'algorithme est choisi selon le nombre de nœuds:

- < 5000 → `spring` (NetworkX simple)
- 5000-20000 → `fruchterman_reingold` (igraph optimisé)
- > 20000 → `drl` (igraph multilevel)
  >

L'utilisateur peut forcer un algorithme spécifique via l'API.

### Pipeline de traitement

1. **Parse CSV** avec Polars (10x+ rapide que pandas)
2. **Construit graphe** NetworkX ou igraph depuis arêtes
3. **Sélection algo** automatique ou manuel
4. **Calcule positions 3D** (x, y, z) avec igraph ou NetworkX
5. **Normalise/scale** positions selon paramètres
6. **Stockage MongoDB** avec metadata
7. **Retourne JSON** `{"positions": {node_id: {x, y, z}}}`

### Avantages igraph

- **Performance C**: Implémentation C native, 10-100x plus rapide que NetworkX
- **Gros graphes**: DrL gère efficacement >100k nœuds
- **Pas de compilation**: Wheels précompilés pour Linux/Windows/macOS
- **API simple**: Conversion NetworkX → igraph facile

### Format CSV prévu

```csv
source,target,weight
A,B,5.0
B,C,3.0
A,C,7.0
```

Colonnes requises: `source`, `target`
Colonnes optionnelles: `weight` (défaut: 1.0)

## Note sur igraph

igraph est une bibliothèque C avec bindings Python officiels.

**Installation:**

- **Wheels précompilés** disponibles pour Linux, macOS, Windows
- **Pas de compilation** nécessaire
- Docker: Installation automatique via `pip install igraph`

**Conversion NetworkX → igraph:**

```python
import igraph as ig
import networkx as nx

# NetworkX → igraph
g_nx = nx.karate_club_graph()
g_ig = ig.Graph.from_networkx(g_nx)

# Layout 3D
layout = g_ig.layout_fruchterman_reingold_3d()
positions = {i: {"x": layout[i][0], "y": layout[i][1], "z": layout[i][2]} 
             for i in range(len(layout))}
```

## Variables d'environnement

Voir `.env.example` pour la liste complète. Principales variables:

- `DATABASE_URL` - URL MongoDB
- `REDIS_URL` - URL Redis
- `SECRET_KEY` - Clé secrète JWT (générer avec `openssl rand -hex 32`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Durée access token (défaut: 30)
- `REFRESH_TOKEN_EXPIRE_DAYS` - Durée refresh token (défaut: 30)
- `ALLOWED_ORIGINS` - Origins CORS autorisés
- `MAX_UPLOAD_SIZE_MB` - Taille max fichiers (défaut: 50)

## TODO

- [ ] **Implémenter graph_service.py** avec NetworkX + igraph
- [ ] Fonctions layout: `_spring_layout_3d()`, `_fruchterman_reingold_3d()`, `_drl_3d()`
- [ ] Conversion NetworkX → igraph pour layouts performants
- [ ] Créer modèle MongoDB `Graph` pour stockage positions calculées
- [ ] Endpoint POST `/graphs/compute` avec paramètres (algorithm, iterations, scale)
- [ ] Endpoint GET `/graphs/{graph_id}/recompute` pour recalculer avec autre algo
- [ ] Cache Redis pour résultats (clé: `graph_id:algorithm:params_hash`)
- [ ] Parser CSV Polars → NetworkX Graph
- [ ] Validation schémas CSV (source, target, weight optionnel)
- [ ] Tests unitaires avec pytest + fixtures graphes
- [ ] Background tasks pour graphes >20k nœuds
- [ ] WebSocket progression calcul temps réel (optionnel)
- [ ] Rate limiting (10 req/min sur /compute)
- [ ] Métriques: temps calcul par algo, distribution tailles graphes
