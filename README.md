# PE_Def_Project

Plateforme de visualisation 3D immersive de graphes avec spatialisation performante.

## Architecture

```
PE_Def_Project/
├── backend/          # FastAPI + Python
│   ├── api/         # Routes et endpoints
│   ├── core/        # Configuration et sécurité
│   ├── models/      # Modèles Beanie (MongoDB)
│   ├── services/    # Logique métier (spatialisation graphes)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/         # Next.js + React + Three.js
│   ├── app/          # App Router Next.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Stack Technique

### Backend
- **FastAPI** 0.121.3 - API REST haute performance
- **MongoDB** 7 (Motor + Beanie) - Base de données
- **Redis** 7 - Cache et sessions
- **NetworkX** 3.5 - Graphes Python
- **igraph** 0.11.8 - Calculs performants (C avec bindings Python)
  - Fruchterman-Reingold 3D (5-20k nœuds)
  - Kamada-Kawai 3D (distance-based)
  - DrL (>20k nœuds, O(n log n))
- **NumPy** + **SciPy** - Calculs scientifiques
- **Polars** - Parsing CSV haute performance

### Frontend
- **Next.js** 15 - Framework React
- **Three.js** / **React Three Fiber** - Rendu 3D
- **WebXR** - VR/AR immersif

### Infrastructure
- **Docker** + **Docker Compose** - Conteneurisation

## Prérequis

- **Docker** et **Docker Compose** installés

## Installation

### 1. Configurer variables d'environnement

```bash
# Copier le fichier d'exemple (contient déjà des valeurs pour le dev)
cp .env.example .env

# Les valeurs par défaut sont prêtes pour le développement local
# Pour la production, modifiez les credentials dans .env
```

**Note:** Le `.env.example` contient des credentials non-sensibles prêts à l'emploi pour le développement. Les devs peuvent l'utiliser tel quel.

### 2. Lancer l'infrastructure

```bash
# Build et démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Arrêter et supprimer volumes (données)
docker-compose down -v
```

## Accès aux services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interface utilisateur Next.js |
| **Backend API** | http://localhost:8000 | API REST FastAPI |
| **API Docs** | http://localhost:8000/docs | Documentation Swagger |
| **MongoDB** | mongodb://localhost:27017 | Base de données (interne) |
| **Redis** | redis://localhost:6379 | Cache (interne) |

## Développement

### Hot Reload

Les volumes bind-mount sont configurés dans `docker-compose.yml` :
- **Backend:** Modification Python → reload automatique uvicorn
- **Frontend:** Modification React/Next.js → fast refresh

### Installer dépendances backend sans reconstruire l'image (pas recommandé)

```bash
docker-compose exec backend pip install <package>

# Puis mettre à jour requirements.txt
docker-compose exec backend pip freeze > backend/requirements.txt
```

### Installer dépendances frontend sans reconstruire l'image (pas recommandé)

```bash
docker-compose exec frontend npm install <package>
```

### Logs en temps réel 

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Algorithmes de Spatialisation 3D

Le backend supporte 3 algorithmes selon taille du graphe :

| Algorithme | Taille graphe | Complexité | Temps estimation |
|------------|---------------|------------|------------------|
| **NetworkX spring_layout** | < 5k nœuds | O(n²) | < 1s |
| **igraph Fruchterman-Reingold 3D** | 5-20k nœuds | O(n²) optimisé | 1-5s |
| **igraph DrL** | > 20k nœuds | O(n log n) | 5-30s |

Sélection automatique par défaut, choix manuel possible via API.

## Troubleshooting

### Erreur "connection refused"

Vérifier que les services sont démarrés :
```bash
docker-compose ps
docker-compose logs -f

### MongoDB connection error

```bash
# Vérifier healthcheck MongoDB
docker-compose ps

# Logs MongoDB
docker-compose logs mongodb
```

## Production

Pour déploiement production, créer `docker-compose.prod.yml` :
- Retirer volumes bind-mount (hot reload)
- Configurer reverse proxy (Nginx/Traefik) avec certificats SSL valides
- Variables d'environnement sécurisées
- Activer rate limiting et monitoring

## License

MIT
