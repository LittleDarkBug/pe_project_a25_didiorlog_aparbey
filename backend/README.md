# Backend API - FastAPI + Celery

API REST pour la gestion des graphes, utilisateurs et projets avec traitement asynchrone via Celery.

## Stack Technique
- **FastAPI** - Framework API async
- **Beanie** - ODM MongoDB async
- **Celery** - Tâches asynchrones
- **Redis** - Cache + Broker Celery
- **NetworkX + igraph** - Traitement de graphes
- **JWT (PyJWT)** - Authentification

## Structure

```
backend/
├── api/
│   ├── routes/
│   │   ├── auth.py      # Inscription, connexion, tokens JWT
│   │   ├── projects.py  # CRUD projets + layouts
│   │   ├── admin.py     # Panel administrateur
│   │   ├── share.py     # Liens de partage
│   │   ├── files.py     # Upload & analyse fichiers
│   │   └── users.py     # Profil utilisateur
│   └── dependencies.py  # Injection dépendances
├── models/
│   ├── user.py          # Modèle User (email, elite, role)
│   ├── project.py       # Modèle Project (graph_data, metadata)
│   └── share_link.py    # Modèle ShareLink (token, expiry)
├── services/
│   └── graph_service.py # Algorithmes de layout (7 algos)
├── core/
│   ├── config.py        # Configuration app
│   ├── security.py      # Hashing, JWT, validation
│   └── redis_client.py  # Client Redis async
├── tasks.py             # Tâches Celery (traitement graphes)
├── celery_app.py        # Configuration Celery
└── main.py              # Point d'entrée FastAPI
```

## Endpoints

### Auth (`/auth`)
- `POST /register/` - Inscription
- `POST /login/` - Connexion → JWT
- `POST /refresh/` - Rafraîchir token
- `POST /logout/` - Déconnexion

### Projects (`/projects`)
- `POST /` - Créer projet (multipart/form-data)
- `GET /` - Lister projets utilisateur
- `GET /public` - Galerie publique
- `GET /{id}` - Détails projet
- `PUT /{id}` - Modifier projet
- `DELETE /{id}` - Supprimer projet
- `POST /{id}/layout` - Recalculer layout
- `GET /tasks/{job_id}` - Polling tâche Celery

### Share (`/share`)
- `POST /generate` - Créer lien partage
- `GET /{token}` - Accéder projet partagé
- `POST /{token}/layout` - Preview layout (sans sauvegarde)

### Admin (`/admin`)
- `GET /stats` - Statistiques
- CRUD `/users` et `/projects`

## Celery Tasks

### `async_process_graph_file`
Traite un fichier de graphe de manière asynchrone:
1. Parse CSV/JSON/GEXF
2. Construit graphe NetworkX
3. Applique algorithme de layout
4. Sauvegarde résultat en MongoDB

**Arguments**:
- `file_path`: Chemin fichier source
- `mapping`: Colonnes source/target/weight
- `algorithm`: Algorithme layout (auto par défaut)
- `project_id`: ID projet à mettre à jour
- `is_new_project`: Supprimer si échec (true pour nouveau)

## Algorithmes de Layout

| Algo                 | Fonction               | Complexité |
| -------------------- | ---------------------- | ---------- |
| auto                 | Sélection intelligente | O(1)       |
| fruchterman_reingold | Force-directed         | O(n²)      |
| kamada_kawai         | Stress minimization    | O(n³)      |
| drl                  | Distributed Recursive  | O(n log n) |
| force_atlas          | ForceAtlas2            | O(n²)      |
| sphere               | Distribution sphérique | O(n)       |
| grid                 | Grille régulière       | O(n)       |
| random               | Aléatoire              | O(n)       |

## Lancement

```bash
# Via Docker (recommandé)
docker compose up backend celery-worker

# Local (développement)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Tests

```bash
pytest
```

## Variables d'environnement

```bash
MONGODB_URI=mongodb://admin:password@mongodb:27017
REDIS_URL=redis://default:password@redis:6379/0
JWT_SECRET=<secret>
JWT_ALGORITHM=HS256
MAX_UPLOAD_SIZE_MB=5000  # 5 Go
```
