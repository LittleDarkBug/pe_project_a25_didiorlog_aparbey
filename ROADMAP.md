# Roadmap du Projet

Ce document trace la feuille de route pour le développement futur de la plateforme de visualisation de graphes.

## Fonctionnalités Implémentées

### Core Features
- [x] **Architecture Backend** : FastAPI, MongoDB (Beanie), Redis
- [x] **Moteur de Calcul** : Service de graphes hybride (NetworkX + igraph) avec layouts 3D
- [x] **Force Atlas** : Implémentation avec extension 3D via détection de communautés
- [x] **Sélection Automatique Intelligente** : Multi-critères (taille, densité, modularité)
- [x] **7 Algorithmes de Spatialisation** : Fruchterman-Reingold, Kamada-Kawai, DrL, Force Atlas, Sphérique, Grille, Aléatoire
- [x] **Visualisation 3D** : Moteur Babylon.js avec optimisations (PBR materials, instancing)
- [x] **Support WebXR** : Mode VR avec locomotion 6DOF, pointer selection, grab interactions
- [x] **Système de Partage** : Liens publics en lecture seule avec prévisualisation layouts
- [x] **Import de Données** : Support CSV, JSON, GEXF avec parsing Polars performant
- [x] **Authentification** : Système complet JWT avec Refresh Tokens et Blacklist
- [x] **Processing Asynchrone** : Celery + Flower pour graphes massifs (>100k nœuds)
- [x] **UI Indicators** : Badge et check pour layout actif dans LayoutSelector

### Module Administration (COMPLET)
- [x] **Dashboard Admin** : Stats (total users, active users, total/public projects)
- [x] **Gestion Utilisateurs** : Liste avec recherche, création, modification rôle/statut, suppression
- [x] **Gestion Projets** : Liste avec recherche, suppression forcée, vue owner
- [x] **Backend Routes** : `/admin/stats`, `/admin/users`, `/admin/projects` (CRUD complet)
- [x] **Frontend Pages** : `/admin`, `/admin/users`, `/admin/projects`
- [x] **Service Admin** : `adminService.ts` complet avec toutes les méthodes

### Filtrage Avancé (COMPLET)
- [x] **Attributs Dynamiques** : Détection automatique catégories, filtrage multi-valeur
- [x] **Recherche Rapide** : Par ID ou Label
- [x] **Filtres Topologiques** :
  - [x] **Voisinage BFS** : N sauts configurables (1-5)
  - [x] **Chemin Court** : Shortest path entre 2 nœuds (BFS)
- [x] **UI Filtres** : Panneau avec onglets Attributs/Topologie, stats temps réel
- [x] **Frontend-Only** : Logique 100% client pour performance

### Performance & Optimisations
- [x] **Instancing** : Master mesh + instances pour nodes et edges (1 draw call)
- [x] **PBR Materials** : Rendu photoréaliste avec emissive glow
- [x] **graphRoot Architecture** : TransformNode pour manipulation globale
- [x] **Tooltips Optimisés** : Texture partagée pour support 100k+ nœuds
- [x] **orjson** : Sérialisation JSON haute performance
- [x] **Polars** : Parsing CSV 10-50x plus rapide que pandas

### VR/XR Features
- [x] **Flying Locomotion** : Navigation 6DOF sans téléportation
- [x] **VR Menu Radial** : 7 layouts + recentrage + quitter
- [x] **VRDetailsPanel** : Panneau détails flottant en VR avec infos nœud/edge
- [x] **Grab Interactions** : Nœuds individuels et graphe entier
- [x] **Environnement Immersif** : GlowLayer + 200 étoiles procédurales

---

## Priorités Immédiates

### 1. Tests & Validation
**AUCUN TEST TROUVÉ** dans le codebase.
- [ ] **Tests Backend** : pytest avec fixtures de graphes
  - [ ] Tests routes (auth, admin, projects, share)
  - [ ] Tests graph_service (layouts, auto-selection)
  - [ ] Tests Celery tasks
- [ ] **Tests Frontend** : Jest + React Testing Library
  - [ ] Tests composants (FilterPanel, LayoutSelector, GraphRenderer)
  - [ ] Tests services (adminService, projectsService)
  - [ ] Tests hooks (useVRMenu, useVRLocomotion)
- [ ] **Tests E2E** : Playwright
  - [ ] Workflow import → visualisation
  - [ ] Workflow admin CRUD
  - [ ] Workflow partage public

### 2. Amélioration Admin
- [ ] **Logs & Audit** : Visualisation logs backend, actions admin tracées
- [ ] **Statistiques Avancées** : Charts usage, distribution tailles graphes, layouts populaires
- [ ] **Bulk Actions** : Sélection multiple users/projects pour actions groupées

### 3. Amélioration Expérience XR
- [ ] **Parité Filtrage** : Accès aux FilterPanel en VR (UI flottante)
- [ ] **Persistance État VR** : Mémoriser position caméra, filtres actifs
- [ ] **Feedback Haptique** : Vibrations sur sélection/grab (si supporté)
- [ ] **Multi-user VR** : Visualisation collaborative en temps réel

---

## Backlog Technique & Fonctionnalités Avancées

Ces tâches seront traitées une fois les priorités immédiates stabilisées.

### Backend & Infrastructure
- [ ] **WebSockets** : Feedback temps réel de progression des calculs longs
- [ ] **Rate Limiting** : Protection des endpoints coûteux
- [ ] **Métriques & Monitoring** : Prometheus/Grafana pour temps de calcul par algo
- [ ] **Cache Stratégique** : Redis pour résultats de calculs fréquents
- [ ] **Logs Structurés** : Amélioration loguru avec rotation et archivage

### Frontend & UX
- [ ] **Mode Collaboratif** : Édition graphe à plusieurs en temps réel (WebSockets)
- [ ] **Export Avancé** : Export vues en images HD, GEXF/GraphML
- [ ] **Thématisation** : Support thèmes clair/sombre et personnalisation couleurs
- [ ] **Historique Layouts** : Revenir aux layouts précédents
- [ ] **Annotations** : Ajouter notes/labels personnalisés sur nœuds
- [ ] **Dashboard Utilisateur** : Statistiques personnelles, graphes récents

### Visualisation Avancée
- [ ] **LOD (Level of Detail)** : Simplification visuelle pour très grands graphes
- [ ] **Edge Bundling** : Regroupement visuel des arêtes pour graphes denses
- [ ] **Layouts Temporels** : Animation de transitions entre algorithmes
- [ ] **Heatmaps** : Visualisation métriques (centralité, PageRank) en couleurs
- [ ] **Clustering Visuel** : Outline automatique des communautés détectées

### Performance
- [ ] **WebAssembly** : Modules Wasm pour calculs physique cote client
- [ ] **Streaming Progressif** : Affichage incremental pour graphes >50k noeuds
- [ ] **Compression Graphes** : Format binaire optimise pour transfert reseau
- [ ] **Worker Threads** : Calculs layouts cote client sans bloquer UI

### Commandes Vocales / NLP (Non Implemente)
- [ ] **Speech-to-Command** : Commandes vocales pour navigation et filtrage
  - [ ] Integration Web Speech API (reconnaissance vocale)
  - [ ] Commandes: "Montre les voisins de X", "Filtre par type Y", "Change layout Z"
  - [ ] Feedback vocal (confirmation actions)
- [ ] **Filtrage NLP** : Requetes en langage naturel
  - [ ] Parsing intent (ex: "affiche tous les serveurs connectes a DB1")
  - [ ] Mapping vers filtres topologiques existants
  - [ ] Suggestions intelligentes basees sur attributs du graphe

---

## Améliorations Documentation

- [ ] **Tutoriels Vidéo** : Guides import, navigation 3D, mode VR
- [ ] **API Reference** : Documentation complète des endpoints
- [ ] **Exemples Datasets** : Graphes d'exemple pour tests rapides
- [ ] **Guide Contribution** : Standards de code, workflow PR
- [ ] **Architecture Diagrams** : Mermaid diagrams pour architecture système

---

## Notes Techniques

### Décisions Architecturales
- Force Atlas = fa2_modified 2D + igraph community detection pour Z
- Auto-selection : 3 critères (taille > densité > modularité)
- Instancing critique pour performance (10k+ nœuds)
- Docker-only pour cohérence environnement développement
- FilterPanel frontend-only pour éviter roundtrips API
- Admin complètement implémenté avec service + routes + pages

### Contraintes Identifiées
- Force Atlas lent pour >5000 nœuds (O(V² + E))
- WebXR hand tracking désactivé (chargement assets)
- Edge updates statiques (pas de suivi si nœud déplacé)
- Aucun test automatisé en place (risque de régression)

### Discoveries from Code Audit
- `adminService.ts` : Full CRUD (stats, users, projects) - IMPLÉMENTÉ
- `FilterPanel.tsx` : Attributes + Topology (BFS neighbors, shortest path) - IMPLÉMENTÉ
- `VRDetailsPanel.ts` : Floating panel with node/edge info in VR - IMPLÉMENTÉ
- `admin.py` : 8 endpoints complets (stats, users CRUD, projects list/delete) - IMPLÉMENTÉ
- `admin/` pages : Layout, users page, projects page - IMPLÉMENTÉS
- Tests: AUCUN fichier test trouvé (pytest, jest, playwright) - À CRÉER
