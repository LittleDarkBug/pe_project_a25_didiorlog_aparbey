[Cahier des charges prévisionnel]{.underline}

[Projet :]{.underline} Conception et réalisation d'une plateforme
interactive grand public de « graph visualisation » en 3D immersive 

[**Étudiants** :]{.underline}

\- Didi Orlog SOSSOU (<didi_orlog.sossou@utt.fr>)

\- F. O. Aimey-Ester PARBEY (<fiosron.parbey@utt.fr>)

**[Tuteur :]{.underline}** Babiga BIRREGAH

# **[Table des matières]{.underline}** {#table-des-matières .TOC-Heading}

[1. Présentation du projet
[2](#présentation-du-projet)](#présentation-du-projet)

[1.1 Contexte et enjeux [2](#contexte-et-enjeux)](#contexte-et-enjeux)

[1.2 Objectifs du projet
[2](#objectifs-du-projet)](#objectifs-du-projet)

[1.3 Périmètre du projet
[2](#périmètre-du-projet)](#périmètre-du-projet)

[2. L'existant [3](#_Toc2002372807)](#_Toc2002372807)

[3. Expression des besoins
[4](#expression-des-besoins)](#expression-des-besoins)

[3.1 Utilisateurs cibles
[4](#utilisateurs-cibles)](#utilisateurs-cibles)

[3.2 Cas d'usage [4](#cas-dusage)](#cas-dusage)

[3.3 Besoins fonctionnels
[5](#besoins-fonctionnels)](#besoins-fonctionnels)

[3.4 Besoins non fonctionnels
[6](#besoins-non-fonctionnels)](#besoins-non-fonctionnels)

[4. Contraintes [7](#contraintes)](#contraintes)

[5. Architecture et choix techniques
[7](#architecture-et-choix-techniques)](#architecture-et-choix-techniques)

[5.1 Approche architecturale
[7](#approche-architecturale)](#approche-architecturale)

[5.2 Technologies frontend
[7](#technologies-frontend)](#technologies-frontend)

[5.3 Technologies backend
[8](#technologies-backend)](#technologies-backend)

[5.4 Gestion des données
[8](#gestion-des-données)](#gestion-des-données)

[6. Livrables attendus [8](#livrables-attendus)](#livrables-attendus)

[7. Critères de validation
[8](#critères-de-validation)](#critères-de-validation)

[8. Planning prévisionnel
[9](#planning-prévisionnel)](#planning-prévisionnel)

## 

## 1. Présentation du projet

### 1.1 Contexte et enjeux

La visualisation de graphes constitue un enjeu majeur dans
l'exploitation de données relationnelles complexes. Les graphes, sont
omniprésents dans de nombreux domaines tels que l'analyse de réseaux
sociaux, la biologie moléculaire, l'analyse d'infrastructures ou la
cybersécurité. La capacité à comprendre rapidement la structure et les
relations au sein d'un graphe influence directement la qualité des
analyses et des décisions qui en découlent.

Les outils actuels de visualisation de graphes reposent majoritairement
sur des représentations bidimensionnelles. Cette approche présente des
limites importantes lorsqu'il s'agit de traiter des graphes de grande
taille ou de structure complexe. La superposition des nœuds et des
liens, l'aplatissement des dimensions, et la difficulté à percevoir la
structure globale constituent des obstacles à une compréhension
intuitive et efficace.

L'émergence des technologies de réalité virtuelle et des standards web
tels que WebXR offre de nouvelles opportunités pour dépasser ces
limites. L'exploitation d'un espace 3D immersif permet une séparation
naturelle des éléments du graphe, une navigation intuitive et une
perception améliorée de la structure globale.

### 1.2 Objectifs du projet

Ce projet vise à concevoir et à développer une plateforme web permettant
la visualisation immersive de graphes en trois dimensions. La plateforme
devra permettre aux utilisateurs d'importer leurs données sous forme de
graphes, de générer automatiquement une représentation 3D spatialisée,
et d'explorer cette représentation de manière immersive à l'aide de
casques de réalité virtuelle.

Les objectifs spécifiques du projet sont les suivants :

-   Permettre l'importation de données de graphes dans des formats
    standards largement utilisés (CSV, JSON)

-   Générer automatiquement des visualisations tridimensionnelles
    optimisées des graphes.

-   Offrir une expérience d'exploration immersive via des casques de
    réalité virtuelle compatibles WebXR.

-   Fournir des outils d'interaction et de filtrage facilitant l'analyse
    de graphes complexes.

-   Garantir des performances satisfaisantes pour des graphes de taille
    moyenne à grande.

-   Proposer une interface intuitive accessible à des utilisateurs non
    spécialistes.

### 1.3 Périmètre du projet

Le projet couvre les fonctionnalités suivantes :

-   Authentification des utilisateurs et gestion de comptes.
-   Import de fichiers de données représentant des graphes au format CSV
    et JSON.
-   Validation automatique de la structure et du format des données
    importées.
-   Génération automatique de visualisations tridimensionnelles
    spatialisées à partir des données importées.
-   Navigation 3D en mode visualisation web standard et en mode immersif
    via casques VR.
-   Sélection interactive de nœuds et affichage de leurs propriétés.
-   Filtrage dynamique de sous-graphes selon des critères définis par
    l'utilisateur.
-   Sauvegarde et rechargement d'états de visualisation.
-   Fonctionnalités collaboratives permettant à plusieurs utilisateurs
    de partager un même projet via un lien d\'accès (URL).

## 2. L'existant

L'analyse de l'existant se concentre sur les plateformes proposant un
flux complet d'importation de données, de génération de visualisations
tridimensionnelles, et d'exploration via des dispositifs de réalité
virtuelle ou mixte. Les bibliothèques de développement nécessitant une
expertise technique approfondie ou les outils de visualisation
bidimensionnelle traditionnels ne sont pas considérés comme directement
comparables au projet envisagé.

#### Flow Immersive

Flow Immersive est une plateforme commerciale transformant des jeux de
données tabulaires en scènes tridimensionnelles interactives. Cette
solution supporte plusieurs dispositifs matériels incluant les casques
Meta Quest et XREAL, ainsi que les navigateurs compatibles WebXR. La
plateforme intègre des fonctionnalités d'interaction naturelle telles
que la reconnaissance vocale et des capacités collaboratives natives.
Flow Immersive se positionne principalement sur le créneau du
storytelling analytique, combinant narration et exploration de données.
Les forces de cette solution résident dans son accessibilité aux
utilisateurs non techniques et son support multi-plateformes. Néanmoins,
son orientation vers le storytelling peut limiter les analyses
techniques approfondies, et le coût d'acquisition constitue une barrière
importante.

#### Immersive Analytics

Immersive Analytics propose une solution d'analytique immersive destinée
aux analystes professionnels et aux décideurs. La plateforme permet
l'importation de datasets variés et leur transformation en
visualisations immersives avec support de dispositifs VR et MR. Cette
solution intègre des workflows analytiques prêts à l'emploi, conçus pour
des besoins métiers spécifiques. Les atouts d'Immersive Analytics
incluent son ciblage professionnel et ses fonctionnalités adaptées aux
contextes décisionnels.

#### Kineviz GraphXR

Kineviz GraphXR est une solution spécialisée dans l'analytique de
graphes avec visualisation 3D native et mode immersif accessible via
navigateurs et casques VR compatibles. GraphXR a été conçu
spécifiquement pour gérer des graphes volumineux comportant plusieurs
milliers de nœuds et de liens. La plateforme intègre des fonctionnalités
analytiques avancées incluant filtrage dynamique, recherche de patterns
et calcul de métriques de centralité. La spécialisation sur les graphes
constitue un atout majeur, mais les licences commerciales représentent
un investissement conséquent et l'interface peut présenter une courbe
d'apprentissage significative pour les utilisateurs non spécialistes.

## 3. Expression des besoins

### 3.1 Utilisateurs cibles

La plateforme s'adresse aux catégories d'utilisateurs suivantes :

-   **Grand public** souhaitant visualiser des données relationnelles
    pour des projets personnels ou professionnels, nécessitant une
    interface intuitive et un processus d'utilisation guidé.

-   **Analystes de données** exploitant des outils de visualisation pour
    comprendre des structures relationnelles complexes, identifier des
    patterns, et communiquer leurs découvertes. Ces utilisateurs
    recherchent des solutions permettant d'explorer des graphes de
    taille moyenne à grande et de sauvegarder leurs analyses.

-   **Chercheurs académiques** travaillant avec des graphes représentant
    des réseaux d'interactions complexes dans des domaines variés tels
    que les sciences sociales, la biologie ou l'informatique. Ces
    utilisateurs nécessitent des outils flexibles permettant
    l'importation de données de sources variées et l'exploration
    approfondie des structures.

-   **Éducateurs et étudiants** utilisant la visualisation comme outil
    pédagogique pour faciliter la compréhension de concepts liés aux
    structures de données, à la théorie des graphes ou à l'analyse de
    réseaux.

### 3.2 Cas d'usage

#### Import et visualisation de données

Un utilisateur dispose d'un fichier (CSV ou JSON) contenant des données
de graphe. Il accède à la plateforme, se connecte à son compte, et
importe son fichier. Le système valide le format et la structure, lui
propose du mapping si nécessaire, génère automatiquement une
représentation 3D du graphe et redirige l'utilisateur vers l'interface
de visualisation.

#### Exploration immersive

Un utilisateur souhaite explorer un graphe en mode immersif. Il met son
casque de réalité virtuelle, active le mode VR depuis l\'interface, et
navigue librement autour et à travers le graphe. Il sélectionne des
nœuds ou des arêtes pour afficher leurs propriétés, applique des filtres
pour isoler des sous‑graphes d\'intérêt, peut effectuer une rotation
contrôlée du graphe pour en changer l\'orientation (par saisie/grip ou
via le joystick du contrôleur).

#### Partage de projet (visionnage libre)

Un utilisateur hôte peut générer un lien de partage (URL) pour un
projet. Tout destinataire du lien peut ouvrir le projet et l\'explorer
immédiatement, de façon autonome. Les positions de caméra, filtres
appliqués et interactions locales ne sont pas synchronisées entre
participants dans ce mode : chaque visiteur navigue librement.

d.  **[Édition collaborative (optionnelle, contrôlée)]{.underline}**

Si l\'hôte a accordé explicitement les droits d\'édition au(x)
participant(s), alors certaines modifications (édition des métadonnées
du projet, modification persistante des états sauvegardés, import de
nouvelles données) pourront être synchronisées entre les utilisateurs
autorisés.

### 3.3 Besoins fonctionnels

Les besoins fonctionnels sont classés selon leur priorité.

#### Besoins critiques

-   Le système devra permettre l'importation de fichiers de données
    représentant des graphes au format CSV et JSON. Le format CSV devra
    supporter une structure comportant au minimum deux colonnes
    identifiant les nœuds source et cible de chaque lien. Le format JSON
    devra supporter une structure contenant deux listes pour les nœuds
    et les liens avec leurs propriétés respectives.

-   Le système devra valider automatiquement le format et la structure
    des fichiers importés, détecter les erreurs de format ou les données
    manquantes, et fournir des messages d'erreur. Une prévisualisation
    des données importées devra être proposée avant génération
    définitive. Une étape de mapping des champs devra être proposée.

-   Le système devra générer automatiquement une représentation 3D
    spatialisée du graphe importé en appliquant un algorithme de
    disposition adapté. Le rendu visuel devra représenter les nœuds par
    des sphères et les liens par des lignes reliant les nœuds.

-   Le système devra permettre la sélection interactive de nœuds. En
    mode visualisation standard, la sélection s\'effectuera par clic de
    souris. En mode immersif, la sélection s\'effectuera par pointage
    avec le contrôleur et activation du trigger (ou du bouton dédié).
    Lors de la sélection, un panneau d\'informations devra afficher
    l\'identifiant, le label, les propriétés et les statistiques
    topologiques du nœud.

-   Le système devra offrir des capacités de navigation intuitive dans
    l\'espace 3D. En mode visualisation web, l\'utilisateur devra
    pouvoir manipuler la vue avec la souris et le clavier, incluant
    rotation, déplacement et zoom. En mode immersif, l\'utilisateur
    devra pouvoir se déplacer et manipuler la vue avec les contrôleurs
    du casque via téléportation ou locomotion continue.

-   Le système devra également permettre la rotation contrôlée du graphe
    lui‑même en mode immersif (par exemple via saisie/grip et mouvement
    du contrôleur, ou via le joystick pour rotation).

-   Le système devra intégrer un système d'authentification sécurisé
    permettant la création de compte, la connexion, et la gestion de
    profil. L'authentification devra reposer sur des mécanismes
    sécurisés incluant le hashage des mots de passe et la protection
    contre les attaques par force brute.

#### Besoins importants

-   Le système devra offrir des fonctionnalités de filtrage dynamique
    permettant de masquer temporairement certains nœuds ou liens selon
    des critères définis. Les critères devront inclure des filtres basés
    sur les propriétés des éléments, des filtres topologiques basés sur
    le degré ou la centralité, et des filtres spatiaux.

-   Le système devra permettre la sauvegarde de l'état actuel d'une
    visualisation, incluant filtres appliqués, position de caméra. Les
    états sauvegardés devront être stockés de manière persistante et
    associés au compte utilisateur. L'utilisateur devrait pouvoir
    recharger un état sauvegardé à tout moment.

-   Le système devra proposer des fonctionnalités collaboratives
    permettant à plusieurs utilisateurs d'explorer simultanément le même
    graphe dans une session partagée. Un utilisateur hôte devra pouvoir
    créer une session et inviter d'autres utilisateurs via un code
    d'accès. Les actions de sélection et de mise en évidence devront
    être visibles par tous les participants en temps réel.

#### Besoins souhaitables

-   Le système pourrait proposer des fonctionnalités d'export permettant
    de sauvegarder des captures d'écran ou d'exporter le graphe dans des
    formats standards tels que GraphML ou GEXF.

-   Le système pourrait intégrer un module de reconnaissance vocale
    permettant à l'utilisateur en mode immersif d'effectuer certaines
    actions par commande vocale, améliorant l'expérience utilisateur en
    réduisant la dépendance aux contrôleurs physiques.

-   Le système pourrait exploiter les capacités de retour haptique des
    casques compatibles pour fournir des sensations tactiles lors de
    l'interaction avec les éléments du graphe.

### 3.4 Besoins non fonctionnels

-   Le système devra maintenir une bonne fréquence d'affichage en mode
    visualisation web sur un ordinateur de spécifications moyennes. Pour
    des graphes de taille supérieure, des mécanismes d'optimisation
    devront maintenir des performances acceptables avec dégradation
    contrôlée de la qualité visuelle.

-   Les opérations de filtrage et de mise à jour devront s'exécuter avec
    un délai raisonnable millisecondes entre l'action utilisateur et la
    mise à jour complète de l'affichage.

-   Le système devra supporter une charge modérée d'utilisateurs
    simultanés, avec une capacité minimale de gérer une dizaine de
    sessions actives simultanément.

-   Les mots de passe devront être hashés avec des algorithmes tels que
    bcrypt ou Argon2 avant stockage.

-   Le système devra implémenter des protections contre les tentatives
    d'authentification par force brute, par limitation du nombre de
    tentatives autorisées et imposition de délais croissants entre
    tentatives échouées.

-   Les jetons d'authentification JWT devront avoir une durée de
    validité limitée avec mécanisme de renouvellement transparent via
    refresh tokens.

-   Le système devra fonctionner correctement sur les versions récentes
    des navigateurs web supportant le standard WebXR (Chrome, Edge).

-   Le système devra supporter les casques de réalité virtuelle
    compatibles WebXR, incluant notamment les casques Meta Quest 2 et 3,
    HTC Vive, et Valve Index.

## 4. Contraintes

-   Le système devra être développé comme une application web accessible
    via navigateurs standards, sans nécessiter d'installation logicielle
    côté client au-delà d'un navigateur moderne.

-   Le système devra exploiter le standard WebXR pour assurer la
    compatibilité avec une large gamme de dispositifs de réalité
    virtuelle.

-   Le système devra reposer sur des technologies web modernes pour
    garantir la maintenabilité et la pérennité du code.

```{=html}
<!-- -->
```
-   Le système devra respecter le Règlement Général sur la Protection
    des Données lors de la collecte, du stockage et du traitement des
    données personnelles des utilisateurs. Les utilisateurs devront être
    informés de l'utilisation de leurs données et donner leur
    consentement explicite lors de la création de compte.

## 5. Architecture et choix techniques

### 5.1 Approche architecturale

Le système suivra une architecture client-serveur classique avec
séparation entre la couche frontend responsable de l'interface
utilisateur et du rendu 3D, et la couche backend responsable de la
logique métier, de la gestion des données et de l'authentification.

Une architecture à trois tiers sera adoptée, séparant la couche de
présentation, la couche de logique métier, et la couche de persistance
des données. Cette séparation facilitera la maintenabilité et
l'évolution du système.

Pour les fonctionnalités collaboratives en temps réel, une communication
bidirectionnelle via WebSocket sera établie entre les clients et le
serveur.

### 5.2 Technologies frontend

Le frontend sera développé avec **Next.js**, un framework web moderne
permettant le développement rapide d'interfaces utilisateur réactives et
performantes.

Pour le rendu 3D et la gestion de la réalité virtuelle, **Babylon.js**
une bibliothèque spécialisée offrant un support natif du standard WebXR
et des performances optimisées pour les environnements web sera
utilisée.

Le développement s'effectuera en **TypeScript** pour bénéficier de la
vérification de type statique, réduisant les risques d'erreurs et
améliorant la maintenabilité.

### 5.3 Technologies backend

Le backend sera développé avec **FastApi,** un framework python moderne
supportant la programmation asynchrone, essentiel pour la gestion
efficace des connexions WebSocket et des opérations d'entrée-sortie.

Le développement s'effectuera en **Python,** pour bénéficier des
bibliothèques spécialisées dans le traitement de graphes, notamment pour
l'implémentation des algorithmes de spatialisation et le calcul de
métriques topologiques.

### 5.4 Gestion des données

**MongoDB**, une base de données NoSQL orientée documents sera utilisée
pour le stockage des données utilisateurs, des métadonnées de graphes,
et des états sauvegardés. Ce type de base offre la flexibilité
nécessaire pour gérer des données de structure variable et assure de
bonnes performances pour les opérations de lecture et écriture.

Pour la gestion du cache et des sessions collaboratives temps réel,
**Redis** sera utilisé, permettant une communication efficace entre les
différentes instances de serveur et une latence minimale pour la
synchronisation.

## 6. Livrables attendus

-   **Application web fonctionnelle** comprenant l'interface utilisateur
    frontend, le serveur backend avec ses API, et les systèmes de
    gestion de données configurés.

-   **Code source complet** de l'application, structuré, commenté et
    versionné dans un système de gestion de versions.

-   **Documentation technique** détaillant l'architecture du système,
    les choix de conception, les modèles de données, les interfaces
    d'API, et les procédures de déploiement et de maintenance.

-   **Documentation utilisateur** expliquant les fonctionnalités de la
    plateforme, fournissant des guides d'utilisation pas à pas, des
    exemples de fichiers de données, et des réponses aux questions
    fréquentes.

-   **Rapport de projet** présentant le contexte, la démarche suivie,
    les difficultés rencontrées et les solutions apportées, les
    résultats obtenus, et les perspectives d'évolution.

-   **Présentation de soutenance** synthétisant le projet, ses
    objectifs, sa réalisation et ses résultats, destinée à l'évaluation
    finale du projet.

## 7. Critères de validation

La validation du projet s\'effectuera selon les axes suivants :

-   **Validation fonctionnelle :** Vérification que l\'ensemble des
    fonctionnalités spécifiées dans la section 3.3 sont implémentées et
    opérationnelles.

-   **Validation des performances :** Vérification que les exigences de
    performance définies dans la section 3.4 sont respectées, notamment
    concernant la fluidité d\'affichage et les temps de réponse.

-   **Validation de la sécurité :** Vérification que les mesures de
    sécurité spécifiées sont correctement implémentées, particulièrement
    pour l\'authentification et la protection des données.

-   **Validation de l\'utilisabilité :** Évaluation de l\'intuitivité et
    de l\'ergonomie de l\'interface par des utilisateurs représentatifs
    des profils cibles.

## 8. Planning prévisionnel

+-------------------+--------+----------------------------------------+
| **Phase**         | **J    | **Détail**                             |
|                   | alon** |                                        |
+===================+========+========================================+
| Analyse et        | Jalon  | Finalisation du cahier des charges ;   |
| conception        | 1      | conception détaillée de l'architecture |
|                   |        | ; modélisation des données ;           |
|                   |        | définition des interfaces ; mise en    |
|                   |        | place de l'environnement de            |
|                   |        | développement et des outils de gestion |
|                   |        | de projet. Estimation : **20 h**.      |
+-------------------+--------+----------------------------------------+
| Développement du  | Jalon  | Implémentation de l'infrastructure     |
| socle technique   | 2      | backend de base ; mise en place de la  |
|                   |        | base de données ; développement du     |
|                   |        | système d'authentification ;           |
|                   |        | implémentation des fonctionnalités     |
|                   |        | d'import et de validation de données.  |
|                   |        | Estimation : **25 h**.                 |
+-------------------+--------+----------------------------------------+
| Développement du  | Jalon  | Implémentation des algorithmes de      |
| moteur de         | 3      | spatialisation ; développement du      |
| visualisation     |        | rendu 3D ; contrôles de navigation en  |
|                   |        | mode web standard ; interface de       |
|                   |        | sélection et d'affichage               |
|                   |        | d'informations.                        |
|                   |        |                                        |
|                   |        | Estimation : **30 h**.                 |
+-------------------+--------+----------------------------------------+
| Développement du  | Jalon  | Intégration du support WebXR;          |
| mode immersif     | 4      | adaptation des contrôles pour casques  |
|                   |        | VR ; optimisation des performances     |
|                   |        | pour le mode immersif ; tests sur      |
|                   |        | différents dispositifs.                |
|                   |        |                                        |
|                   |        | Estimation : **25 h**.                 |
+-------------------+--------+----------------------------------------+
| Fonctionnalités   | Jalon  | Implémentation du système de filtrage  |
| avancées          | 5      | dynamique ; développement des          |
|                   |        | fonctionnalités de                     |
|                   |        | sauvegarde/rechargement ;              |
|                   |        | implémentation des fonctionnalités     |
|                   |        | collaboratives avec WebSocket.         |
|                   |        |                                        |
|                   |        | Estimation : **25 h**.                 |
+-------------------+--------+----------------------------------------+
| Tests et          | Jalon  | Tests fonctionnels ; tests de          |
| optimisation      | 6      | performance et optimisations ;         |
|                   |        | correction des anomalies détectées.    |
|                   |        |                                        |
|                   |        | Estimation : **15 h**.                 |
+-------------------+--------+----------------------------------------+
| Documentation et  | Jalon  | Rédaction de la documentation          |
| finalisation      | 8      | technique complète et de la            |
|                   |        | documentation utilisateur ;            |
|                   |        | préparation de la présentation de      |
|                   |        | soutenance.                            |
|                   |        |                                        |
|                   |        | Estimation : **15 h**.                 |
+-------------------+--------+----------------------------------------+
