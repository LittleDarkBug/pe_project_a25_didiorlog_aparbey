## Fonctionnalités Clés

- **Authentification** : JWT, Refresh Tokens, Blacklist Redis.
- **Gestion de Graphes** : Stockage optimisé, support de grands graphes.
- **Calculs de Layout** : Endpoints dédiés pour recalculer les positions (Fruchterman-Reingold, etc.).
- **Partage** : Génération de tokens uniques pour accès en lecture seule.
  - Endpoint de prévisualisation de layout sans persistance pour les vues partagées.
- **Import/Export** : Support CSV et JSON via Polars.

---

### Traitement asynchrone (Celery + Redis)

Depuis la v2, tout traitement lourd (création/édition/recalcul de projet avec spatialisation) est délégué à une tâche Celery asynchrone, pour garantir la réactivité de l'API même sur de très gros graphes.

**Workflow complet** :

1. Le frontend envoie la création ou l'édition de projet (POST/PUT /projects).
2. L'API retourne immédiatement un `job_id` (et l'id du projet), statut `PENDING`.
3. Le frontend doit poller `/projects/tasks/{job_id}` pour suivre l'état (`PENDING`, `STARTED`, `SUCCESS`, `FAILURE`).
4. Dès que le job est terminé (`SUCCESS`), le résultat (graph_data, metadata, etc.) est automatiquement sauvegardé dans le projet MongoDB (aucune action manuelle requise).
5. Le frontend peut alors rafraîchir la vue du projet pour afficher le graphe.

**Impact frontend** :
- Affichage d'un loader/état "en attente" après création/édition.
- Polling régulier de l'endpoint de tâche jusqu'à succès ou erreur.
- Rafraîchissement automatique du projet une fois le job terminé.

**Gestion des erreurs** :
- Si le job échoue (`FAILURE`), l'API retourne l'erreur détaillée via `/projects/tasks/{job_id}`.
- Le frontend doit afficher un message d'erreur et permettre de relancer ou corriger l'import.

**Avantages** :
- Aucun blocage de l'API, même pour des graphes >100k nœuds.
- Comportement identique à l'utilisateur final (transparence totale).
- Résultat toujours persistant en base dès la fin du traitement.

**À noter** :
- Les lectures simples (GET) restent synchrones et rapides.
- Les modifications légères (nom, description) ne déclenchent pas de job Celery.
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
- **fa2-modified** - Force Atlas 2 pour détection de clusters
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
```

**Celery et Flower sont lancés automatiquement** :
- Le worker Celery (`celery-worker`) exécute les tâches asynchrones du backend.
- Flower (`flower`) permet de monitorer les tâches Celery sur http://localhost:5555.

Vous n'avez rien à lancer manuellement en mode Docker, tout est géré par docker-compose.

**Accès :**
- API: <http://localhost:8000>
- Documentation: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

### Mode développement local (sans Docker)

**Prérequis :**
- Python 3.11+
- MongoDB 7+ en cours d'exécution
- Redis 7+ en cours d'exécution

**En mode local, il faut lancer le worker Celery manuellement dans un terminal séparé :**

```bash
celery -A celery worker --loglevel=info
```

Pour monitorer les tâches (optionnel) :

```bash
celery -A celery flower
```

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
│   ├── user.py         # Modèle utilisateur
│   ├── project.py      # Modèle projet et graphe
│   └── share.py        # Modèle lien de partage
├── schemas/            # Schémas Pydantic pour validation
│   ├── auth.py         # Schémas d'authentification
│   └── ...             # Autres schémas
├── api/
│   ├── dependencies.py # Dépendances réutilisables
│   └── routes/         # Routes API
│       ├── auth.py     # Authentification
│       ├── users.py    # Gestion utilisateurs
│       ├── projects.py # CRUD Projets & Calculs
│       ├── files.py    # Upload/Import
│       └── share.py    # Gestion du partage public
├── services/           # Logique métier
│   ├── auth_service.py # Service d'authentification
│   └── graph_service.py # Service de calcul de graphes (NetworkX/igraph)
└── main.py             # Point d'entrée FastAPI
```

## Fonctionnalités Clés

- **Authentification** : JWT, Refresh Tokens, Blacklist Redis.
- **Gestion de Graphes** : Stockage optimisé, support de grands graphes.
- **Calculs de Layout** : Endpoints dédiés pour recalculer les positions (Fruchterman-Reingold, etc.).
- **Partage** : Génération de tokens uniques pour accès en lecture seule.
  - Endpoint de prévisualisation de layout sans persistance pour les vues partagées.
- **Import/Export** : Support CSV et JSON via Polars.

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

Le système utilise `services/graph_service.py` avec sélection automatique intelligente basée sur 3 critères.

### Algorithmes disponibles

| Algorithme | Taille graphe | Complexité | Usage |
|------------|---------------|------------|-------|
| **Fruchterman-Reingold 3D** | < 2000 nœuds | O(V² + E) | Force-directed équilibré |
| **Kamada-Kawai 3D** | Graphes denses | O(V²) | Préserve topologie, esthétique |
| **DrL** | > 2000 nœuds | O(V log V + E) | Scalable, fait ressortir clusters |
| **Force Atlas** | Modularité > 0.4 | O(V² + E) | Détection communautés, extension 3D |
| **Sphérique** | Navigation VR | O(V) | Distribution uniforme sur sphère |
| **Grille** | Comparaison | O(V) | Organisation géométrique |
| **Aléatoire** | Tests | O(V) | Baseline |

### Sélection automatique intelligente

L'algorithme est choisi selon **3 critères** (voir [SPATIALISATION.md](../SPATIALISATION.md)) :

**Critère 1 : Taille** (prioritaire pour performance)
- \> 5000 nœuds → DrL obligatoire
- 2000-5000 nœuds → DrL sauf si sparse (< 0.01) → Sphérique

**Critère 2 : Densité** (graphes < 2000 nœuds)
- Densité > 0.3 → Kamada-Kawai
- Densité < 0.05 → Sphérique (< 500 nœuds) ou Fruchterman-Reingold

**Critère 3 : Modularité** (structure communautaire)
- Modularité > 0.4 + 3+ communautés → **Force Atlas**
- Sinon → Fruchterman-Reingold (défaut)

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

### Force Atlas - Détails d'implémentation 3D

L'algorithme Force Atlas 2 est originellement 2D. Notre implémentation l'étend en 3D via détection de communautés :

**Pipeline :**
1. **Calcul 2D** : `fa2_modified.ForceAtlas2` avec optimisation Barnes-Hut (theta=1.2)
2. **Détection communautés** : `igraph.community_multilevel()` pour calculer la modularité
3. **Extension Z** : `z = (community_id / max_communities) * z_spacing + jitter`
   - `z_spacing = 20.0` (espacement vertical entre couches)
   - `jitter = random(-2, 2)` (variation pour éviter superposition exacte)

**Configuration Force Atlas :**
```python
ForceAtlas2(
    barnesHutOptimize=True,
    barnesHutTheta=1.2,       # Précision vs performance
    scalingRatio=2.0,         # Espacement des nœuds
    gravity=1.0,              # Attraction vers centre
    iterations=2000           # Nombre d'itérations
)
```

**Quand l'utiliser :**
- Modularité > 0.4
- Au moins 3 communautés distinctes
- Graphes < 5000 nœuds (sinon trop lent)

## Optimisations & Performance

### Sérialisation JSON

**orjson** (C extension) utilisé pour toutes les opérations JSON :
- 2-3x plus rapide que `json` standard
- Support natif datetime, UUID, dataclasses
- Utilisé dans tous les endpoints API

### Parsing CSV

**Polars** (Rust-based) vs pandas :
- 10-50x plus rapide selon taille fichier
- Détection automatique séparateur (`,`, `;`, `\t`, `|`)
- Gestion multi-encodings (utf8, latin1, cp1252, iso-8859-1)

Voir `_read_csv_safe()` dans `graph_service.py` ligne 13.

### I/O Asynchrone

**aiofiles** pour lecture/écriture fichiers sans bloquer l'event loop :
```python
async with aiofiles.open(file_path, 'rb') as f:
    content = await f.read()
```

### Processing Asynchrone (Celery)

**Workflow complet :**
1. Client POST `/projects/` → API retourne `job_id` immédiatement
2. Tâche Celery démarre en background (`tasks.py`)
3. Client poll `/projects/tasks/{job_id}` pour status
4. Résultat sauvegardé automatiquement en MongoDB

**Avantages :**
- Aucun timeout même pour graphes > 100k nœuds
- API reste réactive
- Flower pour monitoring (http://localhost:5555)

**Triggers Celery :**
- Création projet avec spatialisation
- Recalcul layout (changement algorithme)
- Import fichier > 10k nœuds

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

## Roadmap

Voir le fichier [ROADMAP.md](../ROADMAP.md) à la racine du projet pour la feuille de route détaillée.
