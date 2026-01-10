# Frontend - Next.js 16 + Babylon.js

Interface de visualisation 3D/VR de graphes avec Next.js, TypeScript et Babylon.js.

## Stack Technique
- **Next.js 16** - Framework React
- **TypeScript** - Typage statique
- **Babylon.js** - Moteur 3D + WebXR
- **Zustand** - State management
- **TailwindCSS** - Styling
- **NextAuth.js** - Authentification

## Structure

```
frontend/app/
├── (auth)/
│   ├── login/           # Page connexion
│   └── register/        # Page inscription
├── (dashboard)/
│   ├── dashboard/       # Liste projets
│   ├── admin/           # Panel administrateur
│   └── profile/         # Profil utilisateur
├── projects/
│   └── [id]/            # Visualisation 3D/VR
├── gallery/             # Galerie publique
├── share/
│   └── [token]/         # Projet partagé (lecture seule)
├── components/
│   ├── 3DandXRComponents/
│   │   ├── Graph/       # GraphSceneWeb, GraphSceneXR
│   │   ├── UI/          # OverlayControls, DetailsPanel
│   │   └── hooks/       # useXRSession, etc.
│   ├── dashboard/       # ImportWizard, EditProjectModal
│   ├── project/         # FilterPanel, LayoutSelector
│   └── ui/              # Composants génériques
├── services/
│   ├── authService.ts   # Login/register API
│   ├── projectsService.ts # CRUD projets
│   ├── filesService.ts  # Upload fichiers
│   └── adminService.ts  # Admin API
├── hooks/
│   ├── useAuth.ts       # Hook authentification
│   └── useJobPolling.ts # Polling tâches Celery
└── store/
    ├── useToastStore.ts # Notifications
    └── useLoadingStore.ts
```

## Pages

| Route            | Description         | Auth  |
| ---------------- | ------------------- | ----- |
| `/`              | Landing page        | Non   |
| `/login`         | Connexion           | Non   |
| `/register`      | Inscription         | Non   |
| `/dashboard`     | Mes projets         | Oui   |
| `/projects/[id]` | Visualisation 3D/VR | Oui   |
| `/gallery`       | Galerie publique    | Non   |
| `/share/[token]` | Projet partagé      | Non   |
| `/admin`         | Administration      | Admin |

## Composants 3D/XR

### GraphSceneWeb
Rendu 3D dans le navigateur:
- Nœuds comme sphères colorées
- Arêtes comme cylindres
- Labels dynamiques
- Sélection au clic
- Navigation orbitale

### GraphSceneXR
Mode VR immersif:
- Navigation libre (joysticks)
- Sélection laser pointer
- Panneau VR flottant
- Grab du graphe entier

### OverlayControls
Barre de contrôles:
- Reset camera
- Toggle VR
- Export (JSON/Markdown)
- Layout selector
- Filter toggle
- Labels toggle

### FilterPanel
Filtrage avancé:
- Par nœud (autocomplete)
- Par lien
- Topologie (Plus court chemin, Voisins)
- Reset filtres

### LayoutSelector
Choix algorithme layout:
- 7 algorithmes disponibles
- Indicateur de layout actif
- Polling auto pour calcul async

## Services

### projectsService
```typescript
create(payload)          // Upload + création
list()                   // Mes projets
getById(id)              // Détails projet
update(id, data)         // Modification
delete(id)               // Suppression
getTaskStatus(job_id)    // Polling Celery
getByToken(token)        // Projet partagé
updateSharedLayout(token, algo)  // Layout preview
```

### authService
```typescript
login(email, password)   // Connexion
register(data)           // Inscription
logout()                 // Déconnexion
refresh()                // Rafraîchir token
```

## Lancement

```bash
# Via Docker (recommandé)
docker compose up frontend

# Local (développement)
cd frontend
npm install
npm run dev
```

## Configuration

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
AUTH_SECRET=<jwt-secret>
AUTH_TRUST_HOST=true
```

## Build Production

```bash
docker compose up frontend-prod
# Accessible sur http://localhost:3001
```
