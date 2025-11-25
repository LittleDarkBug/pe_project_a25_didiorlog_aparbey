# PE_Def_Project Frontend

Interface utilisateur Next.js pour visualisation 3D/WebXR de graphes spatialisés.

## Stack technique

- **Next.js 15** - Framework React avec App Router
- **TypeScript 5** - Typage statique
- **Babylon.js** - Moteur de rendu 3D WebGL
- **WebXR** - Support VR/AR immersif
- **Zustand 5** - Gestion d'état client (UI, préférences)
- **TanStack React Query 5** - Données serveur (API, cache)
- **Tailwind CSS** - Framework CSS utilitaire

## Installation et démarrage

### Mode Docker (recommandé)

Voir `docker-compose.yml` à la racine:

```bash
cd ..
docker-compose up -d frontend
```

Accès: http://localhost:3000

### Mode développement local

```bash
npm install      # Installe dépendances
npm run dev      # Dev server http://localhost:3000
```

### Variables d'environnement

**Mode Docker:** Variables définies dans `docker-compose.yml`

**Mode local:** Créer `.env.local`

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important:** Les variables préfixées `NEXT_PUBLIC_` sont accessibles côté client (navigateur).

## Architecture du projet

```
app/
├── (auth)/                  # Pages d'authentification
│   ├── login/               # Page de connexion
│   └── register/            # Page d'inscription (avec RGPD)
├── (dashboard)/             # Espace utilisateur connecté
│   ├── page.tsx             # Liste des projets
│   └── profile/             # Gestion du profil
├── (workspace)/             # Espace de travail projet
│   └── project/[id]/        # Visualisation 3D
├── components/              # Composants React réutilisables
│   ├── 3DandXRComponents/   # Composants liés à la 3D et XR
│   │   └── Scene/           # Composant wrapper Babylon.js
│   ├── ui/                  # Composants UI génériques
│   │   └── ToastContainer.tsx # Système de notifications
│   └── webComponents/       # Composants web classiques
│       └── Hero3D.tsx       # Héros 3D de la landing page
│
├── config/                  # Configuration centralisée
│   └── api.ts               # Endpoints API (Auth, Users, Projects)
│
├── lib/                     # Bibliothèques et utilitaires
│   └── apiClient.ts         # Client HTTP central
│
├── providers/               # Context providers React
│   ├── QueryProvider.tsx    # Config React Query
│   └── index.tsx            # Combine tous les providers
│
├── services/                # Services pour les appels API
│   ├── authService.ts       # Authentification (Login, Register, Logout)
│   ├── userService.ts       # Service utilisateur
│   └── index.ts             # Exports des services
│
├── store/                   # Stores Zustand pour l'état client
│   ├── useAuthStore.ts      # Gestion session utilisateur
│   ├── useToastStore.ts     # Gestion notifications
│   └── index.ts             # Exports des stores
│
├── types/                   # Déclarations TypeScript
│   └── css.d.ts             # Permet d'importer des fichiers CSS
│
├── layout.tsx               # Layout racine avec ToastContainer
└── page.tsx                 # Landing Page Premium
```

### Que pouvez-vous modifier ?

- **MODIFIABLE** : Ajoutez vos composants, services, stores, pages selon vos besoins
- **EXEMPLES** : `userService.ts`, `useAppStore.ts`, `test-scene/` sont des exemples à adapter ou supprimer
- **ATTENTION** : `layout.tsx` structure importante, ne pas casser la hiérarchie des Providers
- **NE PAS TOUCHER** : `apiClient.ts`, `SceneComponent.tsx`, `css.d.ts` sauf si vous savez ce que vous faites

## State Management

Le projet utilise deux outils complémentaires pour gérer l'état de l'application :

### 1. Zustand - Pour l'état côté client

**Quand l'utiliser :**
- État de l'interface utilisateur (sidebar ouverte/fermée, theme, etc.)
- Préférences utilisateur stockées localement
- État temporaire qui ne vient PAS d'une API
- Configuration de la scène 3D (caméra, lumières, etc.)

**Comment l'utiliser :**

```typescript
// Importer le store dont vous avez besoin
import { useAppStore } from '@/app/store';

function MonComposant() {
  // Récupérer les valeurs et fonctions du store
  const { isLoading, setLoading, error, setError } = useAppStore();
  
  // Utiliser comme un état React normal
  const handleClick = () => {
    setLoading(true);
    // ... faire quelque chose
    setLoading(false);
  };
  
  return <div>{isLoading ? 'Chargement...' : 'Prêt'}</div>;
}
```

**Stores disponibles (EXEMPLES - modifiez-les selon vos besoins) :**

- `useAppStore` - État global de l'application (loading, erreurs, user info)
- `useScene3DStore` - Configuration des scènes 3D (antialiasing, shadows, etc.)

**Créer un nouveau store :**

1. Créer un fichier dans `app/store/` (ex: `useCartStore.ts`)
2. Définir l'interface de votre état
3. Créer le store avec `create()` de Zustand
4. Exporter dans `app/store/index.ts`

Exemple complet :

```typescript
// app/store/useCartStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/** État du panier d'achat */
interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set) => ({
        items: [],
        addItem: (item) => set((state) => ({ 
          items: [...state.items, item] 
        })),
        removeItem: (id) => set((state) => ({ 
          items: state.items.filter(i => i.id !== id) 
        })),
        clearCart: () => set({ items: [] }),
      }),
      { name: 'cart-storage' } // Nom dans localStorage
    )
  )
);
```

**Middleware disponibles :**
- `devtools` - Active Redux DevTools pour déboguer (toujours actif)
- `persist` - Sauvegarde automatiquement dans localStorage

### 2. React Query - Pour les données serveur

**Quand l'utiliser :**
- Récupérer des données depuis une API
- Envoyer des données au serveur (POST/PUT/DELETE)
- Profiter du cache automatique
- Gérer les états de chargement/erreur des requêtes

**Comment l'utiliser pour récupérer des données (GET) :**

```typescript
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/app/services';
import { QUERY_KEYS } from '@/app/config/api';

function ListeUtilisateurs() {
  // useQuery gère automatiquement : loading, error, cache, refetch
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.USERS.ALL,           // Clé unique pour le cache
    queryFn: userService.getAll,              // Fonction qui appelle l'API
  });
  
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur : {error.message}</div>;
  
  return (
    <div>
      {data?.map(user => <div key={user.id}>{user.name}</div>)}
      <button onClick={() => refetch()}>Actualiser</button>
    </div>
  );
}
```

**Comment l'utiliser pour modifier des données (POST/PUT/DELETE) :**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/app/services';
import { QUERY_KEYS } from '@/app/config/api';

function FormulaireCreationUtilisateur() {
  const queryClient = useQueryClient();
  
  // useMutation pour les opérations de modification
  const mutation = useMutation({
    mutationFn: userService.create,           // Fonction qui envoie les données
    onSuccess: () => {
      // Invalide le cache pour recharger les données
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.USERS.ALL 
      });
      alert('Utilisateur créé !');
    },
    onError: (error) => {
      alert('Erreur : ' + error.message);
    },
  });
  
  const handleSubmit = (formData: CreateUserData) => {
    mutation.mutate(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... vos champs de formulaire ... */}
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Création...' : 'Créer'}
      </button>
    </form>
  );
}
```

**Configuration actuelle :**
- **Cache** : 5 minutes (les données restent en cache pendant 5min avant refetch auto)
- **Garbage Collection** : 10 minutes (données supprimées du cache après 10min d'inactivité)
- **Retry** : 1 tentative (en cas d'échec, réessaie 1 fois)
- **Refetch** : Automatique au focus de la fenêtre et reconnexion réseau

**Cette configuration peut être modifiée dans** `app/providers/QueryProvider.tsx` si vos besoins changent.

### Différence entre Zustand et React Query

| Critère | Zustand | React Query |
|---------|---------|-------------|
| **Usage** | État UI local | Données serveur |
| **Exemple** | Theme, sidebar ouverte, config 3D | Liste d'utilisateurs, produits, commandes |
| **Cache** | Manuel (localStorage avec persist) | Automatique (en mémoire) |
| **Quand mettre à jour** | Vous décidez (`setState()`) | Automatique (refetch, invalidation) |
| **Persistance** | Peut persister dans localStorage | Non (rechargé depuis API) |

**Règle simple :** 
- Les données viennent d'une API ? → React Query
- C'est de l'état local / UI ? → Zustand

## Services API

Les services sont des fichiers qui encapsulent toute la logique d'appels API. Ils utilisent `apiClient` pour communiquer avec le backend.

### Pourquoi utiliser des services ?

Au lieu d'écrire des appels API directement dans vos composants :

```typescript
// MAUVAISE PRATIQUE - logique API dans le composant
function MonComposant() {
  const fetchUsers = async () => {
    const response = await fetch('http://localhost:3001/api/users');
    const data = await response.json();
    return data;
  };
}
```

On centralise tout dans un service :

```typescript
// BONNE PRATIQUE - logique API dans un service
// app/services/userService.ts
export const userService = {
  getAll: () => apiClient.get<User[]>(API_ENDPOINTS.USERS.BASE),
};

// Puis dans le composant
function MonComposant() {
  const { data } = useQuery({
    queryKey: QUERY_KEYS.USERS.ALL,
    queryFn: userService.getAll,  // Simple et réutilisable
  });
}
```

**Avantages :**
- **Réutilisable** : Même fonction utilisée partout
- **Maintenable** : Modifier l'URL une seule fois
- **Testable** : Facile à mocker dans les tests
- **Type-safe** : TypeScript vérifie les types automatiquement

### Structure d'un service

Un service est un objet qui contient des fonctions pour chaque opération API :

```typescript
// app/services/userService.ts
import { apiClient } from '@/app/lib/apiClient';
import { API_ENDPOINTS } from '@/app/config/api';

/** Modèle utilisateur retourné par l'API */
export interface User {
  id: string;
  name: string;
  email: string;
}

/** Données pour créer un utilisateur */
export interface CreateUserData {
  name: string;
  email: string;
}

/** Service pour les opérations CRUD sur les utilisateurs */
export const userService = {
  // GET /api/users - Récupérer tous les utilisateurs
  getAll: () => apiClient.get<User[]>(API_ENDPOINTS.USERS.BASE),
  
  // GET /api/users/:id - Récupérer un utilisateur par son ID
  getById: (id: string) => apiClient.get<User>(API_ENDPOINTS.USERS.BY_ID(id)),
  
  // POST /api/users - Créer un nouvel utilisateur
  create: (data: CreateUserData) => apiClient.post<User>(API_ENDPOINTS.USERS.BASE, data),
  
  // PUT /api/users/:id - Mettre à jour un utilisateur
  update: (id: string, data: Partial<User>) => 
    apiClient.put<User>(API_ENDPOINTS.USERS.BY_ID(id), data),
  
  // DELETE /api/users/:id - Supprimer un utilisateur
  delete: (id: string) => apiClient.delete<void>(API_ENDPOINTS.USERS.BY_ID(id)),
};
```

### Le fichier `apiClient.ts` - NE PAS MODIFIER

Le `apiClient` est un client HTTP qui gère automatiquement :

1. **Headers JSON** : Ajoute automatiquement `Content-Type: application/json`
2. **Timeout** : 30 secondes maximum par requête
3. **Gestion d'erreurs** : Lance des `ApiError` avec status et message
4. **Types TypeScript** : Les réponses sont typées automatiquement

**Méthodes disponibles :**

```typescript
apiClient.get<T>(endpoint, options?)      // GET
apiClient.post<T>(endpoint, data, options?)   // POST
apiClient.put<T>(endpoint, data, options?)    // PUT
apiClient.patch<T>(endpoint, data, options?)  // PATCH
apiClient.delete<T>(endpoint, options?)   // DELETE
```

Vous n'avez PAS besoin de le modifier. Utilisez-le directement dans vos services.

### Créer un nouveau service

1. **Créer le fichier** dans `app/services/` (ex: `productService.ts`)

2. **Définir les interfaces** pour vos données :

```typescript
export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CreateProductData {
  name: string;
  price: number;
}
```

3. **Ajouter les endpoints** dans `app/config/api.ts` :

```typescript
export const API_ENDPOINTS = {
  // ... autres endpoints
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
  },
} as const;

export const QUERY_KEYS = {
  // ... autres clés
  PRODUCTS: {
    ALL: ['products'] as const,
    BY_ID: (id: string) => ['products', id] as const,
  },
} as const;
```

4. **Créer le service** :

```typescript
// app/services/productService.ts
import { apiClient } from '@/app/lib/apiClient';
import { API_ENDPOINTS } from '@/app/config/api';

export const productService = {
  getAll: () => apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS.BASE),
  getById: (id: string) => apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id)),
  create: (data: CreateProductData) => 
    apiClient.post<Product>(API_ENDPOINTS.PRODUCTS.BASE, data),
};
```

5. **Exporter** dans `app/services/index.ts` :

```typescript
export * from './userService';
export * from './productService';  // Ajouter cette ligne
```

6. **Utiliser** dans vos composants avec React Query :

```typescript
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/app/services';
import { QUERY_KEYS } from '@/app/config/api';

function ProductList() {
  const { data: products } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.ALL,
    queryFn: productService.getAll,
  });
  
  return <div>{products?.map(p => <div key={p.id}>{p.name}</div>)}</div>;
}
```

### Fichier de config `api.ts` - MODIFIABLE

Ce fichier centralise tous les endpoints et clés de cache. **Vous DEVEZ le modifier** quand vous ajoutez de nouveaux services.

**Structure actuelle :**

```typescript
// app/config/api.ts

// Configuration de l'API
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000, // 30 secondes
} as const;

// Tous les endpoints de l'API
export const API_ENDPOINTS = {
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
  // Ajoutez vos endpoints ici
} as const;

// Clés pour le cache React Query
export const QUERY_KEYS = {
  USERS: {
    ALL: ['users'] as const,
    BY_ID: (id: string) => ['users', id] as const,
  },
  // Ajoutez vos clés ici
} as const;
```

**Pourquoi centraliser ?**
- Modifier une URL à un seul endroit
- Éviter les fautes de frappe dans les clés de cache
- Autocomplétion TypeScript
- Facile de voir tous les endpoints disponibles

## Babylon.js - Intégration 3D

Babylon.js est un moteur de rendu 3D WebGL. Le projet utilise un composant wrapper React pour faciliter son intégration.

### Le composant `SceneComponent` - NE PAS MODIFIER (sauf bug)

Ce composant se trouve dans `app/components/3DandXRComponents/Scene/SceneComponent.tsx`.

**Son rôle :**
- Créer et gérer le moteur Babylon.js (`Engine`)
- Créer et gérer la scène 3D (`Scene`)
- Nettoyer proprement les ressources à la fin
- Gérer le redimensionnement automatique du canvas

**Vous n'avez PAS besoin de le modifier.** Utilisez-le tel quel dans vos pages.

### Comment créer une page 3D

Voici un exemple complet et commenté pour créer votre première page 3D :

```typescript
'use client';

import SceneComponent from '@/app/components/3DandXRComponents/Scene/SceneComponent';
import { Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core';

export default function Ma3DPage() {
  /**
   * Fonction appelée une fois que la scène Babylon.js est prête
   * C'est ICI que vous créez vos objets 3D, caméras, lumières, etc.
   */
  const onSceneReady = (scene: Scene) => {
    // 1. CRÉER LA CAMÉRA
    // ArcRotateCamera = caméra qui tourne autour d'un point (idéal pour visualiser des objets)
    const camera = new ArcRotateCamera(
      'camera',           // Nom de la caméra
      -Math.PI / 2,       // Position horizontale initiale (en radians)
      Math.PI / 3,        // Position verticale initiale (angle depuis le haut)
      15,                 // Distance au centre (zoom)
      Vector3.Zero(),     // Point visé (centre de la scène)
      scene
    );
    
    // 2. ACTIVER LES CONTRÔLES (souris, touchpad, touch)
    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) {
      camera.attachControl(canvas, false);
      
      // Empêcher le zoom de zoomer la page entière (important !)
      canvas.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
    }
    
    // 3. CRÉER LA LUMIÈRE
    // HemisphericLight = lumière ambiante qui éclaire de manière uniforme
    new HemisphericLight(
      'light',              // Nom de la lumière
      new Vector3(0, 1, 0), // Direction (de haut en bas)
      scene
    );
    
    // 4. CRÉER DES OBJETS 3D (exemples)
    
    // Cube simple
    const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
    box.position.x = -3;  // Position X
    
    // Sphère
    const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 2 }, scene);
    sphere.position.x = 0;
    
    // Cylindre
    const cylinder = MeshBuilder.CreateCylinder('cylinder', { height: 3, diameter: 2 }, scene);
    cylinder.position.x = 3;
  };
  
  /**
   * Fonction appelée à chaque frame (60 fois par seconde)
   * Utilisez-la pour animer vos objets
   */
  const onRender = (scene: Scene) => {
    // Exemple : faire tourner un objet
    const box = scene.getMeshByName('box');
    if (box) {
      box.rotation.y += 0.01;  // Rotation progressive
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <SceneComponent 
        antialias              // Active l'antialiasing (meilleure qualité visuelle)
        adaptToDeviceRatio     // S'adapte à la résolution de l'écran (important pour Retina)
        onSceneReady={onSceneReady}  // Votre fonction de setup
        onRender={onRender}          // Votre fonction d'animation (optionnel)
      />
    </div>
  );
}
```

### Props du `SceneComponent`

| Prop | Type | Description | Requis |
|------|------|-------------|--------|
| `onSceneReady` | `(scene: Scene) => void` | Fonction appelée quand la scène est prête. Créez vos objets 3D ici. | Oui |
| `onRender` | `(scene: Scene) => void` | Fonction appelée à chaque frame. Pour les animations. | Non |
| `antialias` | `boolean` | Active l'antialiasing (lissage des bords). Recommandé. | Non |
| `adaptToDeviceRatio` | `boolean` | S'adapte à la résolution de l'écran. Recommandé pour les écrans Retina. | Non |

### Types de caméras disponibles

```typescript
// 1. ArcRotateCamera - Tourne autour d'un point (RECOMMANDÉ pour la plupart des cas)
const arcCamera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3, 15, Vector3.Zero(), scene);
// Support : souris, touchpad, touch
// Zoom : molette / pinch
// Rotation : clic gauche / swipe
// Pan : clic droit / deux doigts

// 2. FreeCamera - Caméra FPS (première personne)
const freeCamera = new FreeCamera('camera', new Vector3(0, 5, -10), scene);
freeCamera.setTarget(Vector3.Zero());
// Pas de support zoom molette par défaut
// Déplacement : ZQSD ou flèches

// 3. UniversalCamera - Caméra universelle (FPS + touch)
const universalCamera = new UniversalCamera('camera', new Vector3(0, 5, -10), scene);
// Combine FreeCamera + support tactile
```

**Pour la plupart des projets, utilisez `ArcRotateCamera`.**

### Créer des objets 3D

Babylon.js fournit des builders pour créer rapidement des formes :

```typescript
import { MeshBuilder, Color3, StandardMaterial } from '@babylonjs/core';

// Formes de base
const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 2 }, scene);
const cylinder = MeshBuilder.CreateCylinder('cylinder', { height: 3, diameter: 2 }, scene);
const plane = MeshBuilder.CreatePlane('plane', { size: 5 }, scene);
const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);

// Positionner
box.position.x = -3;
box.position.y = 1;
box.position.z = 0;

// Rotation (en radians)
box.rotation.x = Math.PI / 4;  // 45 degrés

// Échelle
box.scaling.x = 2;  // 2x plus large

// Matériaux et couleurs
const material = new StandardMaterial('material', scene);
material.diffuseColor = new Color3(1, 0, 0);  // Rouge (RGB de 0 à 1)
material.specularColor = new Color3(0, 0, 0); // Pas de reflet
box.material = material;
```

### Animer des objets

Deux façons d'animer :

**1. Animation en temps réel (dans `onRender`) :**

```typescript
const onRender = (scene: Scene) => {
  const box = scene.getMeshByName('box');
  if (box) {
    box.rotation.y += 0.01;  // Tourne continuellement
    box.position.y = Math.sin(Date.now() * 0.001) * 2;  // Monte et descend
  }
};
```

**2. Animation Babylon.js (plus performant pour animations complexes) :**

```typescript
import { Animation } from '@babylonjs/core';

const onSceneReady = (scene: Scene) => {
  const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
  
  // Créer une animation
  const animation = new Animation(
    'boxAnimation',
    'rotation.y',        // Propriété à animer
    30,                  // FPS
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CYCLE  // Boucle infinie
  );
  
  // Keyframes (valeurs aux moments clés)
  animation.setKeys([
    { frame: 0, value: 0 },
    { frame: 60, value: Math.PI * 2 },  // 360° en 2 secondes
  ]);
  
  // Appliquer l'animation
  box.animations.push(animation);
  scene.beginAnimation(box, 0, 60, true);  // true = loop
};
```

### Page de test - EXEMPLE (supprimable en production)

Le projet inclut une page de test à `/test-scene` qui montre :
- 5 objets 3D différents avec animations
- Configuration complète de la caméra
- Support touchpad et mobile
- Exemple de `onRender` pour les animations

**Cette page est un EXEMPLE.** Vous pouvez :
- La consulter pour apprendre
- La supprimer en production (`app/test-scene/`)
- La modifier pour tester vos propres objets

### Ressources utiles

- Documentation officielle : https://doc.babylonjs.com/
- Playground (tester du code) : https://playground.babylonjs.com/
- Exemples : https://doc.babylonjs.com/examples/

## Conventions de code

### Structure TypeScript

**Types et interfaces :**

```typescript
// FAIRE : Types explicites pour les props
interface ButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;  // ? pour optionnel
}

// FAIRE : Typer les retours de fonction
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// NE PAS FAIRE : Utiliser 'any'
function processData(data: any) { ... }  // Pas de any !

// FAIRE : Utiliser 'unknown' si vous ne connaissez vraiment pas le type
function processData(data: unknown) {
  if (typeof data === 'string') {
    // TypeScript sait que c'est un string ici
  }
}
```

**Conventions de nommage TypeScript :**

- Interfaces et Types : `PascalCase` (ex: `UserProfile`, `ApiResponse`)
- Props d'un composant : `NomComposantProps` (ex: `ButtonProps`, `CardProps`)
- Types utilitaires : suffixe descriptif (ex: `CreateUserData`, `UpdateProductData`)

### Structure des composants React

**Un composant = un fichier :**

```text
app/
└── components/
    └── webComponents/
        ├── Button.tsx        # Un seul composant par fichier
        ├── Card.tsx
        └── ProductCard.tsx
```

**Template de composant :**

```typescript
'use client';  // Seulement si le composant utilise des hooks ou événements

import { useState } from 'react';
import { useAppStore } from '@/app/store';

/** Description du composant et de son rôle */
interface MonComposantProps {
  title: string;
  onSubmit?: () => void;  // ? = optionnel
}

/** Composant pour afficher... */
export default function MonComposant({ title, onSubmit }: MonComposantProps) {
  const [count, setCount] = useState(0);
  const { isLoading } = useAppStore();
  
  const handleClick = () => {
    setCount(count + 1);
    onSubmit?.();  // ?. = appel optionnel
  };
  
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <button onClick={handleClick}>Cliquer ({count})</button>
    </div>
  );
}
```

**Quand utiliser `'use client'` :**

```typescript
// NÉCESSAIRE : Composant avec hooks
'use client';
import { useState } from 'react';

// NÉCESSAIRE : Composant avec événements (onClick, onChange, etc.)
'use client';
export default function Button({ onClick }) { ... }

// NÉCESSAIRE : Composant qui utilise le Context API ou Zustand
'use client';
import { useAppStore } from '@/app/store';

// PAS NÉCESSAIRE : Composant statique sans interaction
export default function Card({ title, description }) {
  return <div>...</div>;  // Pas de hooks, pas d'événements
}
```

**Règle :** Si vous voyez `useState`, `useEffect`, `onClick`, `onChange`, etc. → ajoutez `'use client'`

### Organisation des imports

Grouper les imports dans cet ordre :

```typescript
// 1. React et Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Bibliothèques externes
import { useQuery } from '@tanstack/react-query';
import { Vector3 } from '@babylonjs/core';

// 3. Imports locaux (avec alias @/)
import { useAppStore } from '@/app/store';
import { userService } from '@/app/services';
import { API_ENDPOINTS } from '@/app/config/api';

// 4. Composants locaux
import Button from './Button';
import Card from './Card';

// 5. Types
import type { User } from '@/app/services/userService';

// 6. CSS (toujours en dernier)
import './styles.css';
```

**Utiliser l'alias `@/` pour les imports absolus :**

```typescript
// FAIRE : Import absolu avec @/
import { useAppStore } from '@/app/store';

// ÉVITER : Import relatif complexe
import { useAppStore } from '../../../store';
```

### Conventions de nommage

| Type | Convention | Exemples |
|------|------------|----------|
| **Fichiers composants** | PascalCase | `Button.tsx`, `ProductCard.tsx`, `UserProfile.tsx` |
| **Fichiers utilitaires** | camelCase | `apiClient.ts`, `utils.ts`, `formatDate.ts` |
| **Fichiers de config** | camelCase | `api.ts`, `theme.ts` |
| **Variables et fonctions** | camelCase | `const userName = ...`, `function fetchData() { ... }` |
| **Constantes** | UPPER_SNAKE_CASE | `const API_URL = ...`, `const MAX_RETRIES = 3` |
| **Types et Interfaces** | PascalCase | `interface User { ... }`, `type ApiResponse = ...` |
| **Composants** | PascalCase | `function Button() { ... }`, `export default Card` |
| **Hooks personnalisés** | camelCase avec `use` | `useLocalStorage`, `useFetch`, `useDebounce` |
| **Dossiers** | camelCase | `components/`, `services/`, `webComponents/` |

**Noms descriptifs :**

```typescript
// FAIRE : Noms clairs et descriptifs
const activeUsers = users.filter(u => u.isActive);
function calculateTotalPrice(items: CartItem[]): number { ... }

// ÉVITER : Noms trop courts ou cryptiques
const au = users.filter(u => u.isActive);  // Qu'est-ce que 'au' ?
function calc(items: any): number { ... }  // 'calc' de quoi ?
```

### Styling avec Tailwind

**Classes utilitaires directement dans le JSX :**

```typescript
// FAIRE : Classes Tailwind inline
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Titre</h1>
  <p className="text-gray-600">Description</p>
</div>

// FAIRE : Conditions avec classes
<button 
  className={`px-4 py-2 rounded ${
    isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
  }`}
>
  Bouton
</button>

// ÉVITER : CSS externe sauf nécessaire
// Utilisez Tailwind d'abord, CSS custom en dernier recours
```

**Classes Tailwind courantes :**

```typescript
// Layout
flex, grid, block, inline, hidden
flex-col, flex-row, justify-center, items-center, gap-4

// Spacing
p-4 (padding), m-4 (margin), px-6, py-2, mt-4, mb-2

// Taille
w-full, w-1/2, h-screen, h-64, max-w-md, min-h-full

// Couleurs
bg-blue-500, text-white, border-gray-300, text-red-600

// Typographie
text-xl, text-2xl, font-bold, font-medium, text-center

// Bordures et arrondis
border, border-2, rounded, rounded-lg, rounded-full, shadow-md

// Responsive
sm:text-lg, md:flex-row, lg:w-1/2 (préfixes pour breakpoints)
```

### Git - Conventional Commits

Format : `type(scope): description`

**Types de commits :**

```bash
feat: Ajouter une nouvelle fonctionnalité
  Exemple: feat(auth): ajouter connexion OAuth Google

fix: Corriger un bug
  Exemple: fix(cart): corriger calcul total avec réduction

refactor: Refactoriser le code (pas de changement fonctionnel)
  Exemple: refactor(api): extraire logique dans services

docs: Modifier la documentation
  Exemple: docs(readme): ajouter section déploiement

style: Modifier le style (CSS, formatting)
  Exemple: style(button): ajuster padding et couleurs

chore: Maintenance (dépendances, config)
  Exemple: chore(deps): mettre à jour React Query 5.90.10

test: Ajouter ou modifier des tests
  Exemple: test(user): ajouter tests service utilisateur

perf: Améliorer les performances
  Exemple: perf(scene): réduire draw calls Babylon.js
```

**Bonnes pratiques :**

```bash
# FAIRE : Message clair et concis
git commit -m "feat(products): ajouter filtres par catégorie"

# FAIRE : Un commit = une modification logique
git commit -m "fix(cart): corriger calcul TVA"

# ÉVITER : Messages vagues
git commit -m "fix stuff"
git commit -m "wip"
git commit -m "update"

# ÉVITER : Trop de modifications dans un commit
git commit -m "feat: ajouter page produits, corriger bugs, refactor API"
```

## Commandes disponibles

```bash
# Développement
npm run dev           # Lance le serveur de développement (http://localhost:3000)
                      # Hot reload activé : les changements sont visibles immédiatement

# Production
npm run build         # Compile le projet pour la production
                      # Optimise les fichiers, génère les bundles
npm start             # Lance le serveur en mode production
                      # À utiliser après 'npm run build'

# Qualité du code
npm run lint          # Vérifie le code avec ESLint
                      # Détecte les erreurs et problèmes de style
npm run lint -- --fix # Corrige automatiquement les problèmes ESLint

# Gestion des dépendances
npm install           # Installe toutes les dépendances
npm install <package> # Installe un nouveau package
npm update            # Met à jour les packages
```

### Workflow de développement typique

```bash
# 1. Installer les dépendances (première fois seulement)
npm install

# 2. Créer le fichier .env.local (première fois seulement)
# Copier .env.example → .env.local et remplir les valeurs

# 3. Lancer le serveur de développement
npm run dev

# 4. Ouvrir le navigateur à http://localhost:3000

# 5. Développer
# Les changements sont automatiquement reflétés dans le navigateur

# 6. Avant de commit
npm run lint          # Vérifier qu'il n'y a pas d'erreurs
git add .
git commit -m "feat: description du changement"
git push
```

## DevTools disponibles

### Zustand DevTools

Permet d'inspecter et manipuler l'état Zustand en temps réel.

**Installation (déjà configurée) :**

Installer l'extension Redux DevTools dans votre navigateur :

- [Chrome](https://chrome.google.com/webstore/detail/redux-devtools/)
- [Firefox](https://addons.mozilla.org/firefox/addon/reduxdevtools/)

**Utilisation :**

1. Ouvrir les DevTools du navigateur (F12)
2. Aller dans l'onglet "Redux"
3. Vous verrez tous vos stores Zustand
4. Chaque action (setState) est loggée avec avant/après

**Fonctionnalités :**

- Voir l'état actuel de tous les stores
- Historique de toutes les modifications
- Time-travel debugging (revenir en arrière dans le temps)
- Inspecter chaque action

### React Query DevTools

Interface visuelle pour inspecter le cache et les requêtes React Query.

**Activation (déjà configurée) :**

Les DevTools apparaissent automatiquement en développement dans le coin inférieur gauche de votre page.

**Utilisation :**

1. Cliquer sur l'icône React Query (coin inférieur gauche)
2. Le panneau s'ouvre avec toutes les queries

**Fonctionnalités :**

- Voir toutes les queries actives (fresh, fetching, stale)
- Inspecter les données en cache pour chaque query
- Voir le statut de chaque query (loading, error, success)
- Voir le temps écoulé depuis le dernier fetch
- Invalider manuellement une query pour tester le refetch
- Voir les mutations en cours

**États d'une query :**

- **fresh** (vert) : Données fraîches, pas besoin de refetch
- **fetching** (bleu) : En cours de chargement
- **stale** (jaune) : Données obsolètes, seront refetch au prochain focus
- **inactive** (gris) : Query non utilisée, sera supprimée dans 10min

## Structure d'un nouveau feature

Quand vous ajoutez une nouvelle fonctionnalité (ex: gestion des produits), voici comment organiser :

```text
1. Créer les types
   → app/services/productService.ts (interfaces Product, CreateProductData)

2. Ajouter les endpoints
   → app/config/api.ts (API_ENDPOINTS.PRODUCTS, QUERY_KEYS.PRODUCTS)

3. Créer le service
   → app/services/productService.ts (productService.getAll, create, etc.)

4. (Optionnel) Créer un store Zustand si besoin d'état local
   → app/store/useProductStore.ts

5. Créer les composants
   → app/components/webComponents/ProductCard.tsx
   → app/components/webComponents/ProductList.tsx

6. Créer la page
   → app/products/page.tsx (utilise useQuery + productService)
```

**Exemple concret (feature "Produits") :**

```typescript
// 1. Types et service (app/services/productService.ts)
export interface Product {
  id: string;
  name: string;
  price: number;
}

export const productService = {
  getAll: () => apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS.BASE),
};

// 2. Config (app/config/api.ts)
export const API_ENDPOINTS = {
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
  },
};

export const QUERY_KEYS = {
  PRODUCTS: {
    ALL: ['products'] as const,
  },
};

// 3. Composant (app/components/webComponents/ProductCard.tsx)
interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">{product.name}</h3>
      <p>{product.price}€</p>
    </div>
  );
}

// 4. Page (app/products/page.tsx)
'use client';

import { useQuery } from '@tanstack/react-query';
import { productService } from '@/app/services';
import { QUERY_KEYS } from '@/app/config/api';
import ProductCard from '@/app/components/webComponents/ProductCard';

export default function ProductsPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.ALL,
    queryFn: productService.getAll,
  });
  
  if (isLoading) return <div>Chargement...</div>;
  
  return (
    <div className="grid grid-cols-3 gap-4 p-8">
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## FAQ - Questions fréquentes

### Quand utiliser Zustand vs React Query ?

**Zustand** : État local UI, préférences, config
- Exemple : theme (dark/light), sidebar ouverte/fermée, position de la caméra 3D

**React Query** : Données qui viennent d'une API
- Exemple : liste d'utilisateurs, produits, commandes

### Comment déboguer une erreur API ?

1. Ouvrir React Query DevTools
2. Trouver la query en erreur (état rouge)
3. Voir l'erreur dans le panneau
4. Vérifier que l'URL est correcte dans `app/config/api.ts`
5. Vérifier que le backend est lancé
6. Tester l'endpoint avec Postman/Insomnia

### Pourquoi mon composant ne se met pas à jour ?

**Zustand :**
```typescript
// Mutation directe (ne déclenche pas de re-render)
const { items } = useCartStore();
items.push(newItem);  // Ne marche pas !

// Utiliser la fonction du store
const { items, addItem } = useCartStore();
addItem(newItem);  // Déclenche un re-render
```

**React Query :**
```typescript
// Après une mutation, invalider le cache
const mutation = useMutation({
  mutationFn: productService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
  },
});
```

### Comment ajouter une nouvelle dépendance ?

```bash
# Installer le package
npm install nom-du-package

# Si c'est un type TypeScript
npm install --save-dev @types/nom-du-package
```

Puis utiliser dans le code :

```typescript
import { quelqueChose } from 'nom-du-package';
```

### Mon composant 3D ne s'affiche pas

**Checklist :**

1. Le composant a-t-il `'use client'` en haut ?
2. Le div parent a-t-il une taille définie (`width`, `height`) ?
3. La caméra est-elle créée et attachée au canvas ?
4. Y a-t-il une lumière dans la scène ?
5. Les objets sont-ils dans le champ de vision de la caméra ?

```typescript
// Configuration minimale qui marche toujours
'use client';

import SceneComponent from '@/app/components/3DandXRComponents/Scene/SceneComponent';
import { Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core';

export default function Test3D() {
  const onSceneReady = (scene: Scene) => {
    // Caméra
    const camera = new ArcRotateCamera('camera', 0, 1, 10, Vector3.Zero(), scene);
    camera.attachControl(scene.getEngine().getRenderingCanvas()!, true);
    
    // Lumière
    new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    
    // Objet
    MeshBuilder.CreateBox('box', { size: 2 }, scene);
  };
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <SceneComponent onSceneReady={onSceneReady} />
    </div>
  );
}
```

### Comment faire persister un store Zustand ?

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',  // Nom dans localStorage
    }
  )
);
```

Les données seront automatiquement sauvegardées dans `localStorage` et restaurées au rechargement.

## Ressources externes

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
