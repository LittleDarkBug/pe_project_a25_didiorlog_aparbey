# Instructions et historique des changements (22/12/2025)

## Besoin utilisateur

- Orchestration complète du backend et frontend avec Docker Compose (dev et production)
- Support du workflow asynchrone (Celery, Flower) pour le backend FastAPI
- Ajout d’un service Next.js en mode production (frontend-prod)
- Robustesse, clarté, et non-régression sur l’expérience utilisateur
- Respect strict de la structure initiale des fichiers (notamment docker-compose.yml)

## Changements réalisés

### Backend / Docker Compose
- Ajout du service celery-worker pour exécuter les tâches asynchrones Celery
- Ajout du service flower pour le monitoring Celery (avec gestion du mot de passe Redis)
- Ajout du service frontend-prod (Next.js en mode build/production) sur le port 3001
- Correction du Dockerfile frontend pour supporter npm run build puis npm start
- Correction de la structure du docker-compose.yml pour éviter les erreurs YAML (réorganisation, puis retour à l’ajout strictement en bas du fichier)
- Respect de la structure existante lors de l’ajout de nouveaux services (aucune modification en haut du fichier)

### Frontend
- Adaptation du workflow asynchrone côté frontend (polling, gestion d’état, UX, documentation)
- Ajout d’un hook de polling (useJobPolling) pour suivre l’état des jobs Celery
- Modification des composants ImportWizard et EditProjectModal pour gérer le job_id, le polling, les loaders et les erreurs
- Documentation claire du workflow asynchrone dans le README frontend

## Inconvénients et retours utilisateur

- L’utilisateur a relevé que certains changements étaient ajoutés en haut du docker-compose.yml, ce qui cassait la structure YAML et pouvait provoquer des erreurs de parsing
- L’utilisateur souhaite que tout ajout/modification soit fait strictement en bas du fichier, sans toucher à l’en-tête ni à l’ordre initial
- L’utilisateur a annulé certains changements pour revenir à une version fonctionnelle, demandant ensuite une simple complétion du fichier existant
- L’utilisateur a insisté sur la robustesse, la non-régression et la clarté de la documentation des changements

