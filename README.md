# Graph 3D/XR - Visualisation Immersive de Graphes

Plateforme web complète pour la visualisation 3D et VR de graphes complexes avec spatialisation intelligente.

## Fonctionnalités

- **Visualisation 3D/WebGL** : Rendu haute performance avec Babylon.js
- **Mode VR immersif** : Navigation WebXR pour casques VR
- **Spatialisation intelligente** : Sélection automatique de l'algorithme optimal selon les caractéristiques du graphe
- **Force Atlas** : Détection avancée de clusters et communautés
- **Import flexible** : Support CSV, JSON, GEXF
- **Partage collaboratif** : Liens publics pour visualisation en lecture seule
- **Authentification sécurisée** : JWT + Argon2id
- **Processing asynchrone** : Celery pour traitement de graphes massifs (>100k nœuds)

## Architecture

### Stack Technique

**Frontend :**
- Next.js 15 + TypeScript
- Babylon.js (moteur 3D)
- WebXR (support VR)
- Zustand (état UI) + TanStack Query (données serveur)
- Tailwind CSS

**Backend :**
- FastAPI 0.121 +  Python 3.11
- MongoDB + Beanie ODM
- Redis (cache + sessions)
- Celery + Flower (tâches async)

**Spatialisation :**
- NetworkX 3.5 (manipulation graphes)
- igraph 0.11.8 (calculs performants C++)
- fa2-modified (Force Atlas 2)
- NumPy + SciPy

## Démarrage Rapide

### Prérequis

- Docker & Docker Compose

### Installation

```bash
# Cloner le repository
git clone <votre-repository>
cd PE_Def_Project

# Créer le fichier d'environnement
cp .env.example .env

# Démarrer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

**Services démarrés :**
- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- API Docs : http://localhost:8000/docs
- Flower (monitoring) : http://localhost:5555
- MongoDB : localhost:27017 (interne)
- Redis : localhost:6379 (interne)

Accédez à http://localhost:3000/register pour créer votre compte.

## 📊 Spatialisation Intelligente

Le système sélectionne automatiquement l'algorithme optimal selon **3 critères** :

### Critère 1 : Taille (prioritaire pour performance)
- **> 5000 nœuds** : DrL obligatoire (seul algorithme scalable)
- **2000-5000 nœuds** : DrL par défaut, sauf si très sparse (< 0.01 densité) → Sphérique

### Critère 2 : Densité (graphes moyens < 2000 nœuds)
- **Densité > 0.3** : Kamada-Kawai (préserve topologie)
- **Densité < 0.05** : 
  - Moins de 500 nœuds → Sphérique
  - Plus de 500 nœuds → Fruchterman-Reingold

### Critère 3 : Modularité (structure communautaire)
- **Modularité > 0.4 + 3+ communautés** : **Force Atlas** (détection clusters)
- **Sinon** : Fruchterman-Reingold (défaut équilibré)

### Algorithmes Disponibles

| Algorithme | Cas d'usage | Complexité |
|------------|-------------|------------|
| **Fruchterman-Reingold** | Graphes moyens, équilibré | O(V² + E) |
| **Kamada-Kawai** | Graphes denses, esthétique | O(V²) |
| **DrL** | Grands graphes (> 5000 nœuds) | O(V log V + E) |
| **Force Atlas** | Clusters et communautés | O(V² + E) |
| **Sphérique** | Navigation immersive VR | O(V) |
| **Grille** | Comparaison structurelle | O(V) |
| **Aléatoire** | Tests et comparaisons | O(V) |

Voir [SPATIALISATION.md](./SPATIALISATION.md) pour plus de détails.

## Structure du Projet

```
PE_Def_Project/
├── frontend/               # Application Next.js
│   ├── app/
│   │   ├── (auth)/         # Authentification
│   │   ├── (dashboard)/    # Dashboard utilisateur
│   │   ├── projects/[id]/ # Visualisation 3D
│   │   ├── share/[token]/  # Partage public
│   │   ├── components/     # Composants React
│   │   │   ├── 3DandXRComponents/  # 3D & VR
│   │   │   └── project/    # Gestion projets
│   │   ├── services/       # Services API
│   │   └── store/          # Stores Zustand
│   └── package.json
│
├── backend/                # API FastAPI
│   ├── api/routes/         # Endpoints
│   ├── core/               # Config, sécurité, DB
│   ├── models/             # Modèles MongoDB
│   ├── services/           # Logique métier
│   │   └── graph_service.py  # Spatialisation
│   ├── tasks.py            # Tâches Celery
│   └── requirements.txt
│
├── docker-compose.yml      # Orchestration services
├── .env.example            # Template variables env
├── SPATIALISATION.md       # Documentation spatialisation
└── README.md              # Ce fichier
```

## Développement

### Workflow Docker

Le projet utilise des **volumes bind-mount** pour le développement :

```yaml
# docker-compose.yml
backend:
  volumes:
    - ./backend:/app  # Hot reload automatique

frontend:
  volumes:
    - ./frontend:/app  # Next.js fast refresh
```

**Modifications → Reload automatique (pas de rebuild nécessaire)**

### Logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery-worker
```

### Rebuild après changement de dépendances

```bash
# Après ajout dans requirements.txt ou package.json
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Accéder à un container

```bash
# Backend (Python/bash)
docker-compose exec backend bash

# Frontend (Node/sh)
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh

# Redis
docker-compose exec redis redis-cli
```

## Utilisation

### Import de graphes

1. **Dashboard** → Bouton "Nouveau Projet"
2. **Upload** fichier CSV/JSON/GEXF
3. **Mapping** colonnes (source, target, propriétés)
4. **Traitement** automatique avec spatialisation intelligente

Format CSV attendu :
```csv
source,target,weight
A,B,5.0
B,C,3.0
```

### Visualisation 3D

- **Navigation** : Souris/touchpad (rotation, zoom, pan)
- **Sélection** : Clic sur nœud → panneau détails
- **Filtrage** : Panneau latéral pour filtres avancés
- **Layouts** : Menu "Vues" pour changer l'algorithme

### Mode VR

1. **Connecter** casque VR compatible WebXR
2. **Bouton VR** en bas à droite de la visualisation
3. **Navigation** : Joysticks pour vol libre
4. **Sélection** : Pointer + gâchette
5. **Menu VR** : Layouts, recentrage, quitter

Voir [instructions-pro3.md](./instructions-pro3.md) pour le guide complet XR.

## Docker Compose

Services définis :

- **mongodb** : Base de données
- **redis** : Cache et sessions
- **backend** : API FastAPI
- **celery-worker** : Worker asynchrone
- **flower** : Monitoring Celery
- **frontend** : Next.js (mode dev)
- **frontend-prod** : Next.js (build production)

```bash
# Démarrer tout
docker-compose up -d

# Voir les logs
docker-compose logs -f backend

# Rebuild un service
docker-compose up -d --build frontend-prod

# Arrêter tout
docker-compose down
```

## Sécurité

- **Passwords** : Argon2id (time_cost=3, memory_cost=64MB, parallelism=4)
- **JWT** : HS256 avec access tokens (30min) + refresh tokens (30j)
- **CORS** : Origins configurables
- **Upload** : Limite configurable (défaut 50MB)
- **Rate limiting** : À implémenter selon besoins

## Performance

- **Petits graphes (< 500 nœuds)** : < 1s
- **Graphes moyens (500-2000)** : 1-5s
- **Grands graphes (2000-10k)** : 5-30s
- **Très grands (> 10k)** : Traitement async avec Celery, pas de timeout

Le processing asynchrone garantit la réactivité de l'API sur tous les graphes.

## Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## Documentation

- [SPATIALISATION.md](./SPATIALISATION.md) - Logique de spatialisation détaillée
- [instructions-pro3.md](./instructions-pro3.md) - Guide WebXR/VR
- [backend/README.md](./backend/README.md) - Documentation API
- [frontend/README.md](./frontend/README.md) - Documentation Frontend
- API Docs : http://localhost:8000/docs (Swagger)
- ReDoc : http://localhost:8000/redoc

## Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## License

[À définir]

## Équipe

Projet réalisé dans le cadre de [contexte du projet].

## Support

Pour signaler un bug ou demander une fonctionnalité, ouvrir une issue sur GitHub.
