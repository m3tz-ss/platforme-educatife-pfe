## Gestion des stages – API Laravel

Ce projet est une application **Laravel 12** qui expose une **API de gestion des stages** (plateforme “MyStage”).  
Elle permet aux entreprises et aux étudiants de gérer tout le cycle de vie d’un stage : offres, candidatures, entretiens, encadrement et suivi.

### 1. Contexte du projet de stage

L’objectif de ce projet est de :

- **Modéliser le processus de recrutement des stagiaires** (depuis la création de l’offre jusqu’à l’acceptation/refus).
- **Structurer le code avec de bons design patterns** (séparation contrôleurs / services / repositories / modèles / resources).
- **Proposer une architecture propre et évolutive**, adapté à un contexte professionnel.

Ce dépôt constitue le **backend API**. Il peut être consommé par un front-end (SPA, mobile, etc.) via des endpoints JSON.

### 2. Fonctionnalités principales

- **Authentification & rôles**
  - Authentification API via **Laravel Sanctum**.
  - Gestion des rôles avec `spatie/laravel-permission` (ex. `manager`, `rh`, `encadrant`, `student`, `admin`).
  - Endpoints : `/api/login`, `/api/register`, `/api/logout`, `/api/me`, etc.

- **Offres de stage**
  - Création, modification, suppression d’offres par les entreprises (manager/RH).
  - Consultation des offres publiques côté étudiant via `/api/public/offers`.
  - Attribution de l’offre à une entreprise (`enterprise_id`).

- **Candidatures**
  - Un étudiant peut **postuler à une offre** avec envoi de CV.
  - Vérification de la **double candidature** (pas deux candidatures pour la même offre et le même étudiant).
  - Notification par **email** à l’entreprise lors d’une nouvelle candidature.
  - Mise à jour de l’état de la candidature (nouveau, présélectionnée, entretien, acceptée, refusée, …) avec notification email à l’étudiant.

- **Entretiens**
  - Planification des entretiens pour une candidature donnée.
  - Suivi de l’historique des entretiens pour l’entreprise et pour l’étudiant.

- **Utilisateurs internes (RH / Encadrants / Manager)**
  - Création et gestion des collaborateurs internes par le manager.
  - Affectation d’un **encadrant** à un étudiant/stagiaire.

- **Profil utilisateur**
  - Gestion d’un profil enrichi (téléphone, adresse, bio, école, domaine, année de graduation, entreprise, etc.).
  - Changement de mot de passe.

### 3. Architecture et design patterns

Le code suit une architecture inspirée des **clean architectures** et des bonnes pratiques Laravel :

- **Controllers (`app/Http/Controllers`)**
  - Gèrent les **requêtes HTTP** et les **réponses JSON**.
  - Contiennent le minimum de logique métier.
  - Exemple : `OfferController`, `ApplicationController`, `AuthController`, `UserController`, etc.

- **Services (`app/Services`)**
  - Portent la **logique métier** réutilisable.
  - Exemples :
    - `ApplicationService` : création de candidature, validation, envoi d’emails (entreprise / étudiant), récupération des candidatures d’un étudiant ou d’une entreprise.
    - (Extension naturelle) `OfferService`, `InterviewService`, etc. pour centraliser progressivement la logique métier.

- **Repositories (`app/Repositories`)**
  - Encapsulent les accès à la **base de données** pour une entité donnée.
  - Exemple : `ApplicationRepository` propose des méthodes comme :
    - `existsForStudent($studentId, $offerId)` : vérifier une candidature existante.
    - `getByStudent($studentId)` : candidatures d’un étudiant.
    - `getByEnterprise($userId)` : candidatures reçues par une entreprise/manager.

- **Models Eloquent (`app/Models`)**
  - Représentent les entités du domaine :
    - `User`, `Offer`, `Application`, `Interview`, `Enterprise`.
  - Définissent les **relations** (ex. `User::applications()`, `Offer::applications()`, `Enterprise::offers()`, etc.).

- **API Resources (`app/Http/Resources`)** *(amélioration design pattern conseillée)*
  - Permettent de **centraliser la forme des réponses JSON**, au lieu de construire manuellement des tableaux dans les contrôleurs.
  - Exemple recommandé : `OfferResource` pour formater les offres côté API publique (`/api/public/offers`) et éventuellement côté tableau de bord entreprise.

Cette structure permet :

- une **séparation claire des responsabilités**,
- une **meilleure testabilité** (tests unitaires/services, repositories),
- une **maintenance facilitée** (la logique métier ne se répand pas dans les contrôleurs).

### 4. Stack technique

- **Backend**
  - PHP `^8.2`
  - Laravel `^12.0`
  - Sanctum pour l’authentification API
  - Spatie Permission pour les rôles & permissions

- **Frontend / Build**
  - Vite `^7.0.7`
  - Tailwind CSS `^4.0.0`
  - `resources/views/welcome.blade.php` comme page d’accueil par défaut Laravel (peut servir pour tester rapidement que le projet fonctionne).

### 5. Installation et démarrage

#### 5.1. Prérequis

- PHP 8.2+
- Composer
- Node.js + npm
- Une base de données (MySQL, PostgreSQL, SQLite, ...), configurée dans `.env`

#### 5.2. Installation rapide

Depuis le dossier du projet :

```bash
composer install
cp .env.example .env   # Sous Windows, copier le fichier manuellement
php artisan key:generate
php artisan migrate

npm install
npm run build          # ou `npm run dev` pour le mode développement
```

> Astuce : le projet inclut aussi un script `composer setup` qui enchaîne l’installation, la génération de clé, les migrations et le build front.

#### 5.3. Lancer le projet en développement

Dans un premier terminal :

```bash
php artisan serve
```

Dans un second terminal :

```bash
npm run dev
```

L’API sera accessible typiquement sur `http://localhost:8000` (ou le port indiqué par `php artisan serve`), avec les routes API sous le préfixe `/api`.

### 6. Endpoints principaux (aperçu)

Les routes sont déclarées principalement dans `routes/api.php`. Quelques exemples :

- **Authentification**
  - `POST /api/login`
  - `POST /api/register`
  - `POST /api/logout`
  - `GET /api/me` (user connecté, via Sanctum)

- **Offres**
  - `GET /api/public/offers` : liste des offres publiques pour les étudiants.
  - `GET /api/offers` : offres de l’entreprise/manager connecté.
  - `POST /api/offers` : créer une offre.
  - `PUT /api/offers/{offer}` : modifier une offre.
  - `DELETE /api/offers/{offer}` : supprimer une offre.

- **Candidatures**
  - `POST /api/applications` : postuler (étudiant).
  - `GET /api/my-applications` : candidatures de l’étudiant connecté.
  - `GET /api/enterprise/applications` : candidatures reçues par l’entreprise.
  - `PATCH /api/applications/{id}` : mise à jour du statut.

- **Entretiens**
  - `POST /api/enterprise/interviews`
  - `PATCH /api/enterprise/interviews/{id}/result`
  - `GET /api/enterprise/applications/{id}/interviews`
  - `GET /api/student/applications/{id}/interviews`

- **Gestion interne**
  - `POST /api/enterprise/setup-manager`
  - `GET /api/internal-users`
  - `POST /api/internal-users`
  - `PUT /api/internal-users/{id}`
  - `DELETE /api/internal-users/{id}`

- **Encadrants & profils**
  - `POST /api/assign-encadrant/{id}`
  - `GET /api/encadrants`
  - `GET /api/encadrant/students`
  - `GET /api/user/profile`
  - `POST /api/user/profile`
  - `POST /api/user/change-password`

### 7. Pistes d’amélioration (design & clean code)

Dans le cadre du stage, plusieurs axes d’amélioration sont possibles et déjà partiellement engagés :

- **Généraliser le pattern Service + Repository**
  - Extraire progressivement la logique métier des contrôleurs (`OfferController`, `InterviewController`, `UserController`, etc.) vers des services dédiés.
  - Centraliser les requêtes complexes dans des repositories pour faciliter l’évolution du schéma de base de données.

- **Utiliser les API Resources Laravel**
  - Créer des resources comme `OfferResource`, `ApplicationResource`, `InterviewResource` pour homogénéiser les réponses JSON.
  - Réduire la duplication de code dans les contrôleurs et clarifier le contrat de réponse côté front.

- **Validation & DTO / FormRequests**
  - Remplacer les validations inline dans les contrôleurs par des `FormRequest` dédiés (ex. `StoreOfferRequest`, `UpdateOfferRequest`).

- **Tests**
  - Ajouter des tests unitaires pour les services et repositories.
  - Ajouter des tests d’API pour les principaux flux (auth, offre, candidature, entretien).

Ces améliorations permettent d’obtenir un projet **professionnel, propre, maintenable** et bien adapté à un rapport de stage.
