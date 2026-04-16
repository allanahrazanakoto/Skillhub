# Rapport — corrections et mise en place CI/CD (SkillHub Groupe DAS)

Ce document résume les problèmes rencontrés et les corrections appliquées pour stabiliser l’application (front, back), l’affichage des médias, les tests et le pipeline GitHub Actions.

---

## 1. Authentification et espace public (frontend)

### Problème
- L’interface publique affichait un utilisateur comme « déjà connecté » alors que la session n’était pas fiable (données `localStorage` seules).
- Les comptes avec un rôle non prévu pour l’interface (ex. `admin`) pouvaient créer des incohérences (lien vers un dashboard qui ne correspond pas au rôle).

### Corrections
- **`skillhub_front/src/components/NavbarPublic.jsx`** : connexion affichée uniquement si `token` + `utilisateur` + rôle `participant` ou `formateur` ; nettoyage des états incohérents ; lien profil sécurisé.
- **`skillhub_front/src/components/ProtectedRoute.jsx`** : en cas de rôle incorrect pour la route, purge de la session (`removeToken`) pour éviter les sessions « fantômes ».
- **`skillhub_front/src/connexion/login.jsx`** : refus explicite des rôles autres que `participant` / `formateur`, avec message utilisateur clair.

---

## 2. Images de formations (upload / affichage)

### Problème
- Les fichiers étaient bien enregistrés sous `storage/app/public/formations`, mais l’URL `/storage/...` renvoyait une erreur (ex. 403) : **`public/storage` n’était pas le lien symbolique Laravel** attendu (souvent un dossier vide après changement de branche sous Windows).

### Correction (environnement local)
- Suppression du dossier `public/storage` incorrect puis exécution dans `skillhub_back` :
  - `php artisan storage:link`
- Vérification : une requête HTTP sur une image sous `/storage/formations/...` doit répondre **200**.

---

## 3. Espace étudiant — erreur PHP « progression on null »

### Problème
- **`Attempt to assign property "progression" on null`** dans le contrôleur des inscriptions : une inscription pouvait exister alors que la formation associée avait été supprimée (`$ins->formation` à `null`).

### Correction
- **`skillhub_back/app/Http/Controllers/Api/InscriptionController.php`** :
  - filtre `whereHas('formation')` sur la requête des inscriptions ;
  - garde-fou dans le `map` + `filter()->values()` pour ignorer les cas orphelins.

---

## 4. API — réponses 401 / 500 sur routes protégées

### Problème
- Sans token, certaines routes API renvoyaient **`500` avec `Route [login] not defined`** au lieu d’un **401 JSON**, car Laravel tentait une redirection web vers une route `login` inexistante pour une API JSON.

### Corrections
- **`skillhub_back/bootstrap/app.php`** :
  - rendu **401 JSON** pour `AuthenticationException` sur toutes les requêtes `api/*` (sans exiger `expectsJson()` uniquement) ;
  - `redirectGuestsTo` : pas de redirection vers `/login` pour les chemins `api/*`.

---

## 5. Tests backend en CI — Composer et MongoDB

### Problème
- Sur Ubuntu, le paquet **`php*-mongodb`** fournit souvent **`ext-mongodb` 2.1.4**, alors que **`mongodb/mongodb` 2.2** exige **`ext-mongodb` ^2.2** → **`composer install`** échouait.

### Correction
- **`composer install`** en CI avec **`--ignore-platform-req=ext-mongodb`** (les tests PHPUnit n’activent pas MongoDB si `MONGODB_URI` n’est pas défini dans l’environnement de test).

---

## 6. Tests backend — secret JWT manquant

### Problème
- En CI : `.env` généré depuis `.env.example` **sans** `JWT_SECRET` → **`JWTException: Secret is not set`** lors des tests utilisant `auth('api')->login()`.

### Correction
- **`skillhub_back/phpunit.xml`** : ajout de **`JWT_SECRET`** dans la section `<php><env .../></php>` (valeur dédiée aux tests uniquement, à ne pas utiliser en production).

---

## 7. Pipeline GitHub Actions (`ci.yml`)

### Objectifs
- Alignement avec le backlog (tests back + front, build, Docker, traçabilité par commit).
- CI centrée sur la branche **`dev`** (pas de déclenchement sur **`main`** pour ce workflow), avec **CD (push GHCR)** sur **push vers `dev`** uniquement.

### Contenu principal du workflow
- **Backend** : PHP 8.2, `composer install` (avec ignore `ext-mongodb`), `.env`, `key:generate`, **PHPUnit** (Unit + Feature) avec rapport **JUnit** en artifact.
- **Frontend** : Node 20, `npm ci`, **lint**, **tests Vitest**, **build** production.
- **Docker** : validation **`docker compose config`**, **`docker compose pull`** MySQL + Mongo, **`docker build`** API + front tagués avec **`${{ github.sha }}`**.
- **CD** : login **GHCR**, build + **push** `skillhub-api` et `skillhub-front` (`:sha` et `:latest`), namespace propriétaire en minuscules.

### Déclenchement
- **`push`** sur **`dev`** uniquement.
- **`pull_request`** dont la **branche cible** est **`dev`** uniquement.
- **`paths-ignore`** : si le commit / la PR ne modifie **que** des fichiers sous `Doc/**` ou des fichiers `**/*.md` (ex. `CONTRIBUTING.md`, rapport `.md`), **le workflow ne tourne pas** (pas de re-run complet pour une doc seule).

Conséquence pour le travail en branche `feature/*` : pas de CI tant qu’il n’y a pas de **PR vers `dev`** ou de travail directement poussé sur **`dev`**.

---

## 8. Références utiles

| Sujet | Fichiers / commandes |
|--------|----------------------|
| CI/CD | `.github/workflows/ci.yml` |
| Branches / commits | `CONTRIBUTING.md` |
| Tests PHPUnit / JWT test | `skillhub_back/phpunit.xml` |
| Lien fichiers publics | `php artisan storage:link` dans `skillhub_back` |

---

## 9. Pistes de suivi (optionnel)

- Contrainte FK + `ON DELETE CASCADE` sur les inscriptions pour éviter définitivement les inscriptions orphelines.
- Élargir le `on:` du workflow aux branches `feature/*` si l’équipe souhaite une CI à chaque push hors PR.
- Rapport de couverture de tests (PHPUnit / Vitest) en artifact, comme dans le backlog « intégration des rapports ».

---

*Document généré pour le suivi projet — à mettre à jour si de nouvelles corrections majeures sont ajoutées.*
