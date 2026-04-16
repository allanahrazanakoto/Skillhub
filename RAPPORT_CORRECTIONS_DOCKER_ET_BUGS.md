# Rapport de Corrections Docker et Bugs

## Contexte

Ce document résume les problèmes identifiés sur la branche Docker, les causes techniques, les correctifs appliqués, et les manques observés dans l'implémentation initiale.  
L'objectif est de permettre au responsable technique de comprendre rapidement ce qui bloquait réellement l'exécution du projet et ce qui doit être surveillé à l'avenir.

## Symptome Initial Principal

- Le frontend démarrait mais les actions API (notamment connexion/inscription) retournaient `Failed to fetch`.
- L'API Laravel répondait en erreur 500 dans plusieurs cas.
- La stack Docker n'était pas cohérente avec une architecture Laravel classique attendue (MySQL absent au départ).

## Bugs Identifiés et Correctifs

### 1) Service GitHub Actions présent sur la branche Docker

**Problème**
- La branche devait contenir uniquement l'implémentation Docker.
- Un workflow CI/CD GitHub Actions était présent.

**Correctif**
- Suppression du fichier `/.github/workflows/ci-cd.yml`.

**Impact**
- Branche recentrée sur son périmètre (Docker uniquement).

---

### 2) Build backend Docker cassé : `pdo_sqlite` impossible à compiler

**Erreur observée**
- `Package 'sqlite3' not found`
- Echec sur `docker-php-ext-install pdo pdo_sqlite ...`

**Cause racine**
- Dépendance système SQLite manquante dans l'image PHP Alpine.

**Correctif**
- Ajout de `sqlite-dev` dans `skillhub_back/Dockerfile`.

**Impact**
- Le build de l'image API n'échoue plus à l'étape `pdo_sqlite`.

---

### 3) Incohérence `composer.json` / `composer.lock`

**Erreur observée**
- `Required package "mongodb/mongodb" is not present in the lock file`

**Cause racine**
- Fichiers Composer non alignés (merge incomplet ou lock non regénéré).

**Correctif**
- Regénération/alignement du lock.
- Mise à jour de la contrainte package MongoDB côté Composer.

**Impact**
- `composer install` peut résoudre les dépendances de manière déterministe.

---

### 4) Incompatibilité version package MongoDB vs extension PHP

**Erreur observée**
- `mongodb/mongodb ... requires ext-mongodb ^1.21.0`
- extension installée dans l'image: `2.2.1`

**Cause racine**
- Le package PHP MongoDB était verrouillé sur une version incompatible avec l'extension PECL installée.

**Correctif**
- Harmonisation en utilisant `mongodb/mongodb` compatible avec l'extension installée (`^2.2`).
- Mise à jour de `composer.json` et `composer.lock`.

**Impact**
- Compatibilité versionnelle rétablie, build stable.

---

### 5) Fichier `.env.example` exclu du contexte Docker

**Erreur observée**
- `cp: can't stat '.env.example': No such file or directory`

**Cause racine**
- `.dockerignore` excluait tous les `.env.*`, y compris `.env.example`.

**Correctif**
- Ajout d'exception dans `skillhub_back/.dockerignore`:
  - `!.env.example`

**Impact**
- Le Dockerfile peut créer `.env` correctement pendant le build.

---

### 6) Frontend pointait vers `http://api:8000` côté navigateur

**Symptôme**
- `Failed to fetch` dans le navigateur.

**Cause racine**
- `api` est un hostname réseau Docker interne, non résolvable depuis le navigateur hôte.

**Correctif**
- Front configuré en URL relative `/api` (build arg + env frontend).
- Le proxy Nginx route `/api` vers `api:8000` côté réseau Docker.

**Impact**
- Le navigateur appelle `localhost:5173/api/...` sans dépendre du DNS interne Docker.

---

### 7) Stack DB incohérente : MySQL manquant alors qu'attendu

**Problème**
- Au départ, l'API était en SQLite.
- Aucune image/service MySQL dans `docker-compose.yml`.

**Correctif**
- Ajout du service `mysql:8.0` dans `docker-compose.yml`.
- Ajout volume persistant `mysql-data`.
- Configuration API sur MySQL:
  - `DB_CONNECTION=mysql`
  - `DB_HOST=mysql`
  - `DB_PORT=3306`
  - `DB_DATABASE=skillhub`
  - `DB_USERNAME=skillhub`
  - `DB_PASSWORD=skillhubpass`

**Impact**
- Stack alignée avec une architecture Laravel standard + persistance DB.

---

### 8) Erreur `Laravel\Pail\PailServiceProvider not found` pendant le build

**Erreur observée**
- Crash sur `php artisan key:generate` dans l'image.

**Cause racine**
- Fichier cache local `bootstrap/cache/packages.php` copié dans l'image.
- Ce cache contenait des providers dev (`laravel/pail`) absents en install `--no-dev`.

**Correctif**
- Exclusion des caches Laravel compilés dans `skillhub_back/.dockerignore`:
  - `/bootstrap/cache/*.php`
  - exception conservée pour `.gitignore`

**Impact**
- L'image ne récupère plus de cache local contaminé par l'environnement dev.

---

### 9) Erreur runtime persistante : `no such table: sessions` (SQLite)

**Erreur observée**
- `SQLSTATE[HY000]: no such table: sessions`
- Laravel lisait encore des sessions via SQLite.

**Cause racine**
- `.env.example` dans l'image restait orienté SQLite + `SESSION_DRIVER=database`.
- En conséquence, l'application pouvait dériver vers SQLite/session DB selon le contexte.

**Correctif**
- Mise à jour de `skillhub_back/.env.example`:
  - `DB_CONNECTION=mysql` + variables DB MySQL
  - `SESSION_DRIVER=file`
  - `CACHE_STORE=file`
- Rebuild/recreate API.
- Vérification des valeurs effectives en runtime Laravel.

**Impact**
- Suppression du couplage aux tables `sessions/cache` SQL en environnement dev Docker.
- Endpoint racine API revenu en `HTTP 200`.

## Etat Final Vérifié

- Services Docker actifs:
  - `api` (Laravel)
  - `frontend` (Nginx)
  - `mysql` (base principale)
  - `mongo` (logs activité)
- Build API et frontend OK.
- Migrations Laravel exécutables sur MySQL.
- Configuration runtime vérifiée:
  - `database.default = mysql`
  - `session.driver = file`
- Backend répond sur `http://localhost:8000`.
- Frontend répond sur `http://localhost:5173`.

## Manques dans le Développement Initial (constat)

- Absence de MySQL malgré un besoin attendu côté projet.
- Variables d'environnement backend non alignées avec la stack cible.
- Gestion des sessions/cache non sécurisée pour un contexte Docker dev.
- Mauvaise frontière entre environnement local et image Docker (cache Laravel local copié).
- Incohérences de dépendances Composer (`composer.json` vs `composer.lock`).
- Configuration frontend API non adaptée au contexte navigateur (DNS Docker interne).

## Commande Recommandée Après Merge de Branches

Pour avoir un environnement à jour après merge (code + image + DB):

```powershell
docker compose up -d --build; docker compose exec api php artisan migrate --force
```

Optionnel si seed nécessaire:

```powershell
docker compose exec api php artisan db:seed --force
```

## Points de Vigilance pour les Prochaines Contributions

- Toujours aligner `composer.lock` après modification de `composer.json`.
- Ne jamais inclure les caches compilés Laravel de la machine locale dans l'image.
- Pour le frontend Dockerisé, préférer `/api` + proxy interne plutôt que `http://api:8000` côté navigateur.
- Vérifier la cohérence DB cible (MySQL) dans:
  - `docker-compose.yml`
  - `.env.example`
  - variables runtime
- Après chaque merge:
  - rebuild containers
  - exécuter migrations
  - vérifier `docker compose ps`

