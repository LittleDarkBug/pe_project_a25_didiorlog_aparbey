# Interactions VR & Mapping des Touches

Voici la liste des interactions disponibles en mode VR/WebXR et leur mapping sur les contrôleurs standards (Oculus/Meta, Index, etc.) :

| Interaction                        | Contrôleur / Touche         | Description |
|-------------------------------------|-----------------------------|-------------|
| **Déplacement (flying)**            | Joystick gauche             | Avancer, reculer, gauche, droite (flying 6DoF) |
| **Rotation de la vue**              | Joystick droit              | Tourner la caméra (yaw) à gauche/droite |
| **Sélection nœud/lien**             | Gâchette (Trigger)          | Pointer un nœud/lien avec le rayon, appuyer pour ouvrir le panneau de détails |
| **Grab (saisie) d’un nœud**         | Gâchette (Trigger) ou Grip  | Maintenir sur un nœud pour le déplacer en VR |
| **Grab du graphe entier**           | Bouton Menu (≡, B ou Y)     | Maintenir pour déplacer tout le graphe d’un bloc |
| **Ouvrir le menu VR**               | Bouton Menu (≡)             | Affiche le menu VR flottant |
| **Quitter la VR**                   | Menu VR → Quitter           | Quitte la session immersive |

**Remarques :**
- Le flying (déplacement) est toujours sur le joystick gauche, la rotation sur le droit, quel que soit le casque.
- Le bouton Menu correspond à ≡ sur Oculus/Meta, ou B/Y sur d’autres contrôleurs.
- Le grab global fonctionne uniquement en maintenant le bouton Menu.
- Les interactions sont optimisées pour Babylon.js/WebXR, mais peuvent varier selon le navigateur ou le casque (mapping standardisé ici).

# PE_Def_Project

Plateforme de visualisation 3D immersive de graphes avec spatialisation performante.

## Architecture

```
PE_Def_Project/
├── backend/          # FastAPI + Python
│   ├── api/         # Routes (Auth, Projects, Users, Files, Share)
│   ├── core/        # Configuration, Sécurité, Redis
│   ├── models/      # Modèles Beanie (User, Project, Graph, ShareLink)
│   ├── services/    # Logique métier (Auth, Graphes, Partage)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/         # Next.js + React + Babylon.js
│   ├── app/          # App Router (Auth, Dashboard, Projects, Share)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Stack Technique

### Backend
- **FastAPI** 0.121.3 - API REST haute performance
- **MongoDB** 7 (Motor + Beanie) - Base de données (Users, Projects, Graphs)
- **Redis** 7 - Cache, Sessions, Blacklist Tokens
- **NetworkX** 3.5 - Graphes Python
- **igraph** 0.11.8 - Calculs performants (C avec bindings Python)
  - Fruchterman-Reingold 3D (5-20k nœuds)
  - Kamada-Kawai 3D (distance-based)
  - DrL (>20k nœuds, O(n log n))
- **NumPy** + **SciPy** - Calculs scientifiques
- **Polars** - Parsing CSV haute performance

### Frontend
- **Next.js** 15 - Framework React
- **Babylon.js** - Rendu 3D & WebXR (Moteur principal)
- **Zustand** - Gestion d'état (Auth, Toast, UI)
- **Tailwind CSS** - Design Premium (Glassmorphism)
- **WebXR** - VR/AR immersif

### Infrastructure
- **Docker** + **Docker Compose** - Conteneurisation

## Fonctionnalités Principales

- **Visualisation 3D** : Exploration immersive de graphes complexes.
- **Spatialisation** : Algorithmes de layout performants (Fruchterman-Reingold, Kamada-Kawai, DrL).
- **Mode VR** : Immersion totale avec support WebXR.
- **Partage Public** : Génération de liens de partage en lecture seule avec prévisualisation des layouts.
- **Filtrage Avancé** : Filtres dynamiques côté client (attributs, recherche).
- **Gestion de Projets** : Création, édition, import CSV/JSON.

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

## Fonctionnalités de Filtrage

L'application propose un système de filtrage avancé exécuté côté client ("Frontend-Only") pour une réactivité immédiate.

### 1. Filtres par Attributs
Détecte automatiquement les propriétés catégorielles de vos données (ex: "groupe", "type", "département").
- **Recherche Rapide** : Filtre instantané par ID ou Label.
- **Catégories** : Cochez/décochez des valeurs pour masquer des groupes entiers de nœuds.

### 2. Filtres Topologiques (Onglet "Topologie")
Permet d'explorer la structure du graphe.

- **Voisinage (Neighbors)** :
  - Isole un nœud central et ses voisins jusqu'à une certaine distance.
  - **Profondeur (Sauts/Hops)** :
    - 1 saut : Voisins directs.
    - 2 sauts : Voisins des voisins.
    - etc.

- **Chemin le plus court (Shortest Path)** :
  - Trouve et affiche uniquement le chemin le plus direct entre deux nœuds (Algorithme BFS).
  - Utile pour analyser les connexions entre deux entités distantes.

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
