# PE_Def_Project - Visualisation de Graphes 3D/VR

Plateforme de visualisation immersive de graphes en 3D et réalité virtuelle (WebXR), permettant d'importer, analyser et explorer des réseaux de données complexes.

## Démarrage Rapide

### Prérequis
- Docker & Docker Compose
- Casque VR compatible WebXR (optionnel)

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd PE_Def_Project

# Configurer les variables d'environnement
cp .env.example .env

# Lancer tous les services
docker compose up
```

### URLs d'accès
| Service         | URL                   | Description                        |
| --------------- | --------------------- | ---------------------------------- |
| Frontend (Dev)  | http://localhost:3000 | Mode développement avec hot reload |
| Frontend (Prod) | http://localhost:3001 | Mode production optimisé           |
| Backend API     | http://localhost:8000 | API FastAPI + Swagger UI           |
| Flower          | http://localhost:5555 | Monitoring des tâches Celery       |

---

## Architecture

```
PE_Def_Project/
├── backend/                 # API FastAPI + Celery
│   ├── api/routes/          # Endpoints REST
│   ├── models/              # Modèles MongoDB (Beanie)
│   ├── services/            # Logique métier (layouts)
│   └── tasks.py             # Tâches asynchrones Celery
├── frontend/                # Next.js 16 + TypeScript
│   └── app/
│       ├── components/      # UI & 3D/XR Components
│       ├── services/        # API clients
│       ├── hooks/           # React hooks
│       └── store/           # Zustand stores
└── docker-compose.yml       # Orchestration des services
```

### Services Docker

| Service       | Image          | Port  | Description           |
| ------------- | -------------- | ----- | --------------------- |
| mongodb       | mongo:7        | 27017 | Base de données       |
| redis         | redis:7-alpine | 6379  | Cache & Broker Celery |
| backend       | ./backend      | 8000  | API FastAPI           |
| frontend      | node:20        | 3000  | Next.js (dev)         |
| frontend-prod | node:20        | 3001  | Next.js (prod)        |
| celery-worker | ./backend      | -     | Worker async          |
| flower        | ./backend      | 5555  | Monitoring Celery     |

---

## API Backend

### Authentification (`/auth`)
| Méthode | Endpoint          | Description                         |
| ------- | ----------------- | ----------------------------------- |
| POST    | `/auth/register/` | Inscription (Free ou demande Elite) |
| POST    | `/auth/login/`    | Connexion - JWT tokens              |
| POST    | `/auth/refresh/`  | Rafraîchir access token             |
| POST    | `/auth/logout/`   | Déconnexion (blacklist token)       |

### Projets (`/projects`)
| Méthode | Endpoint                   | Description                   |
| ------- | -------------------------- | ----------------------------- |
| POST    | `/projects/`               | Créer projet (upload fichier) |
| GET     | `/projects/`               | Lister mes projets            |
| GET     | `/projects/public`         | Galerie publique              |
| GET     | `/projects/{id}`           | Détails d'un projet           |
| PUT     | `/projects/{id}`           | Modifier projet               |
| DELETE  | `/projects/{id}`           | Supprimer projet              |
| POST    | `/projects/{id}/layout`    | Recalculer layout             |
| GET     | `/projects/tasks/{job_id}` | Polling tâche Celery          |

### Partage (`/share`)
| Méthode | Endpoint                | Description                      |
| ------- | ----------------------- | -------------------------------- |
| POST    | `/share/generate`       | Créer lien de partage            |
| GET     | `/share/{token}`        | Accéder projet partagé           |
| POST    | `/share/{token}/layout` | Preview layout (sans sauvegarde) |

### Administration (`/admin`)
| Méthode             | Endpoint          | Description           |
| ------------------- | ----------------- | --------------------- |
| GET                 | `/admin/stats`    | Statistiques globales |
| GET/POST/PUT/DELETE | `/admin/users`    | Gestion utilisateurs  |
| GET/PUT/DELETE      | `/admin/projects` | Gestion projets       |

### Fichiers (`/files`)
| Méthode | Endpoint              | Description                |
| ------- | --------------------- | -------------------------- |
| POST    | `/files/analyze`      | Analyser structure fichier |
| GET     | `/files/preview/{id}` | Prévisualiser données      |

---

## Frontend

### Pages
| Route            | Description                    |
| ---------------- | ------------------------------ |
| `/`              | Landing page                   |
| `/login`         | Connexion                      |
| `/register`      | Inscription                    |
| `/dashboard`     | Liste des projets              |
| `/projects/[id]` | Visualisation 3D/VR            |
| `/gallery`       | Galerie publique               |
| `/share/[token]` | Projet partagé (lecture seule) |
| `/admin`         | Panel administrateur           |

### Composants 3D/XR
- **GraphSceneWeb**: Rendu 3D navigateur (Babylon.js)
- **GraphSceneXR**: Mode VR immersif (WebXR)
- **OverlayControls**: Contrôles UI (reset, VR, export)
- **FilterPanel**: Filtrage noeuds/liens
- **LayoutSelector**: Choix algorithme layout
- **DetailsPanel**: Infos noeud/lien sélectionné

### Services Frontend
| Service         | Description              |
| --------------- | ------------------------ |
| authService     | Connexion/inscription    |
| projectsService | CRUD projets + layout    |
| filesService    | Upload & analyse         |
| shareService    | Génération liens partage |
| adminService    | Admin API                |
| userService     | Profil utilisateur       |

---

## Algorithmes de Layout

| Algorithme               | Description                  | Cas d'usage           |
| ------------------------ | ---------------------------- | --------------------- |
| **auto**                 | Sélection intelligente       | Défaut recommandé     |
| **fruchterman_reingold** | Force-directed classique     | < 1000 noeuds         |
| **kamada_kawai**         | Préserve distances           | Petits graphes        |
| **drl**                  | Distributed Recursive Layout | Grands graphes        |
| **force_atlas**          | Clustering visuel            | Détection communautés |
| **sphere**               | Distribution sphérique       | VR immersif           |
| **grid**                 | Grille régulière             | Comparaison           |
| **random**               | Aléatoire                    | Baseline              |

**Sélection automatique** (basée sur densité et taille):
- Dense (>0.1) + petit (<200): Kamada-Kawai  
- Dense + grand: ForceAtlas  
- Sparse + petit: Fruchterman-Reingold  
- Sparse + grand: DrL  

---

## Plans Utilisateurs

| Fonctionnalité            | Free     | Elite |
| ------------------------- | -------- | ----- |
| Import fichiers (max 5Go) | Oui      | Oui   |
| Visualisation 3D/VR       | Oui      | Oui   |
| Filtres & layouts         | Oui      | Oui   |
| Projets temporaires       | Oui      | -     |
| Projets persistants       | -        | Oui   |
| Publier en galerie        | -        | Oui   |
| Projets privés            | -        | Oui   |
| Partage par lien          | Session* | Oui   |

*Liens de partage Free expirent a la deconnexion.

---

## Formats Supportés

| Format | Extension | Description                       |
| ------ | --------- | --------------------------------- |
| CSV    | `.csv`    | Colonnes source/target/weight     |
| JSON   | `.json`   | Node-link format ou liste d'edges |
| GEXF   | `.gexf`   | Standard Gephi                    |

**Mapping automatique**: Détection intelligente des colonnes source/target.

---

## Configuration

### Variables d'environnement (`.env`)

```bash
# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=<password>
MONGO_DATABASE=graphdb

# Redis  
REDIS_PASSWORD=<password>

# JWT
JWT_SECRET=<secret-key>
JWT_ALGORITHM=HS256

# Limites
MAX_UPLOAD_SIZE_MB=5000  # 5 Go
```

---

## Tests

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

---

## Documentation Complementaire

- [Backend README](./backend/README.md) - API, endpoints et structure backend
- [Frontend README](./frontend/README.md) - Pages, composants et services frontend
- [SPATIALISATION.md](./SPATIALISATION.md) - Details algorithmes de layout
- [ROADMAP.md](./ROADMAP.md) - Feuille de route du projet
- [docs/](./docs/) - Documentation technique additionnelle

