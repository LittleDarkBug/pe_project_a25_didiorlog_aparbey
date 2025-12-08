# Roadmap du Projet

Ce document trace la feuille de route pour le développement futur de la plateforme de visualisation de graphes.

##  Priorités Immédiates

### 1. Module Administration (Gestion Plateforme)
L'objectif est de fournir une interface complète pour les administrateurs du système.
- [ ] **Dashboard Admin** : Vue d'ensemble des statistiques (nombre d'utilisateurs, projets, charge système).
- [ ] **Gestion Utilisateurs** : Liste, bannissement, modification de rôles, suppression de comptes.
- [ ] **Gestion Projets** : Vue globale de tous les projets, modération de contenu, suppression forcée.
- [ ] **Logs & Audit** : Visualisation des logs d'erreurs et d'activités critiques.

### 2. Expérience XR (WebXR / VR)
Amener l'expérience VR au même niveau de fonctionnalité que la vue 3D sur écran.
- [ ] **Parité des Interactions** : Porter toutes les interactions de la scène 3D (sélection, déplacement, infos) en mode XR.
- [ ] **Finalisation Interactions Actuelles** : Polissage du système de locomotion et de manipulation.
- [ ] **Transitions Fluides** : Améliorer l'entrée et la sortie du mode VR (positionnement caméra, persistance de l'état).
- [ ] **UI en VR** : Intégration des panneaux de contrôle (filtres, layouts) directement dans l'espace virtuel (panneaux flottants).

### 3. Layouts & Performance
Optimiser le moteur de calcul et de rendu pour des graphes massifs.
- [ ] **Nouveaux Algorithmes** : Intégration de layouts supplémentaires (ex: ForceAtlas2, OpenOrd via igraph).
- [ ] **Optimisation Rendu** : Instanced Mesh pour les nœuds (déjà en place, à optimiser), LOD (Level of Detail) pour les très grands graphes.
- [ ] **WebAssembly (Wasm)** : Explorer l'utilisation de modules Wasm pour les calculs de physique côté client si nécessaire.

---

## Backlog Technique & Fonctionnalités Avancées

Ces tâches seront traitées une fois les priorités immédiates stabilisées.

### Backend & Infrastructure
- [ ] **Tests Unitaires & Intégration** : Couverture complète avec `pytest` et fixtures de graphes.
- [ ] **Tâches d'Arrière-plan** : Gestion asynchrone robuste (Celery/Redis Queue) pour les graphes >20k nœuds.
- [ ] **WebSockets** : Feedback en temps réel de la progression des calculs de layout longs.
- [ ] **Rate Limiting** : Protection des endpoints coûteux (ex: 10 req/min sur `/compute`).
- [ ] **Métriques & Monitoring** : Suivi des temps de calcul par algo, distribution des tailles de graphes (Prometheus/Grafana).

### Frontend & UX
- [ ] **Mode Collaboratif** : Édition de graphe à plusieurs en temps réel (WebSockets).
- [ ] **Export Avancé** : Export des vues en images HD, ou export des données en GEXF/GraphML.
- [ ] **Thématisation** : Support complet des thèmes clair/sombre et personnalisation des couleurs de graphe.

---

## ✅ Fonctionnalités Déjà Implémentées

- [x] **Architecture Backend** : FastAPI, MongoDB (Beanie), Redis.
- [x] **Moteur de Calcul** : Service de graphes hybride (NetworkX + igraph) avec layouts 3D.
- [x] **Visualisation 3D** : Moteur Babylon.js avec support WebXR de base.
- [x] **Système de Partage** : Liens publics en lecture seule avec prévisualisation de layout.
- [x] **Import de Données** : Parsing CSV performant via Polars.
- [x] **Authentification** : Système complet JWT avec Refresh Tokens et Blacklist.
