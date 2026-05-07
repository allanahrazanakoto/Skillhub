# SkillHub — Documentation Technique Individuelle

## Présentation du projet

SkillHub est une plateforme de gestion de formations en ligne. Dans le cadre du TP5, j'ai développé et intégré un **microservice d'authentification Spring Boot** qui remplace le système JWT Laravel d'origine.

Le projet adopte une architecture **microservices** locale, exécutée directement avec **Spring Boot + Laravel** sans Docker.

---

## Architecture microservices

```
+------------------+   +------------------+
|  skillhub_auth   |   |  skillhub_back   |
|  Spring Boot     |   |  Laravel PHP 8.2 |
|  Java 21         |<--|  valide token    |
|  :8080           |   |  via localhost:8080 |
+--------+---------+   +--------+---------+
         |                      |
         +----------+-----------+
                    |
         +----------v-----------+
         |   skillhub_mysql     |
         |   MySQL 8            |
         |   authdb + skillhub  |
         +----------------------+

+------------------+
|  skillhub_mongo  |  MongoDB 7 (logs activite)
+------------------+
```

### Flux d'authentification (SSO)

1. L'utilisateur s'inscrit ou se connecte via le **frontend** -> appel vers **Spring Boot** (`/auth-api/`)
2. Spring Boot verifie les credentials, genere un token **HMAC-SHA256** et le retourne
3. Le frontend stocke le token et l'envoie dans chaque requete (`Authorization: Bearer token`)
4. Le **middleware Laravel** (`ValidateAuthToken`) appelle Spring Boot pour valider le token
5. Si valide, Laravel identifie l'utilisateur et traite la requete

---

## 1. Microservice Auth — Spring Boot

### Technologies utilisees
- Java 21 + Spring Boot 3.x
- Spring Data JPA + MySQL
- Maven

### Ce que j'ai developpe

#### Entite User (`entity/User.java`)
Represente un utilisateur dans la base `authdb`. J'ai ajoute le champ `prenom`.

```java
private String prenom;
public String getPrenom() { return prenom; }
public void setPrenom(String prenom) { this.prenom = prenom; }
```

#### AuthController (`controller/AuthController.java`)

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Inscription — valide, chiffre, sauvegarde |
| `POST /api/auth/login` | Connexion — verifie credentials, genere token |
| `GET /api/auth/validate?token=...` | Valide un token — retourne les infos utilisateur |
| `GET /api/me` | Profil de l'utilisateur connecte |

#### Securite implementee
- **AES-GCM** (`EncryptionService`) : chiffrement des mots de passe
- **HMAC-SHA256** (`HmacService`) : generation et verification des tokens
- **Nonce + Timestamp** (`AuthNonce`) : protection anti-replay
- **Validation mot de passe** : 12 caracteres min, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractere special

---

## 2. API Laravel — Integration du microservice

### Middleware ValidateAuthToken

J'ai cree ce middleware pour remplacer le systeme JWT Laravel par un appel au microservice Spring Boot.

```php
// 1. Extraire le token Bearer
$token = substr($authHeader, 7);

// 2. Appeler Spring Boot pour valider
$response = Http::timeout(5)
    ->get("http://127.0.0.1:8080/api/auth/validate", ['token' => $token]);

// 3. Attacher l'utilisateur a la requete
$request->merge(['authUser' => [
    'email'  => $data['email'],
    'role'   => $data['role'],
    'nom'    => $data['nom'],
    'prenom' => $data['prenom'],
]]);

// 4. Creer l'utilisateur dans Laravel s'il n'existe pas encore
$utilisateur = Utilisateur::firstOrCreate(
    ['email' => $email],
    ['nom' => ..., 'prenom' => ..., 'role' => ...]
);
Auth::setUser($utilisateur);
```

`firstOrCreate` est essentiel : il cree l'utilisateur dans la table Laravel `utilisateurs` si celui-ci s'est inscrit via Spring Boot mais n'a jamais ete synchronise.

### Suppression de l'ancien AuthController Laravel

L'ancien `AuthController.php` gerait JWT localement. Je l'ai supprime car l'authentification est maintenant entierement geree par Spring Boot.

---

## 3. Frontend React

### Modifications apportees

**`inscription.jsx`** :
- Champ `prenom` ajoute
- Champ de confirmation du mot de passe
- Barre de force du mot de passe (rouge/orange/vert)
- Criteres : 12 caracteres, majuscule, minuscule, chiffre, caractere special

**`auth.js`** : Inclut `prenom` dans tous les appels API

**`header.jsx`** : Affichage prenom + nom de l'utilisateur connecte

---

## 4. Execution locale

### Services actifs

| Service | Technologie | Port |
|---------|-------------|------|
| skillhub_auth | Spring Boot Java 21 | 8080 |
| skillhub_back | Laravel PHP 8.2 | 8000 |
| MySQL local | WAMP / MySQL | 3306 |

### Commandes utilisees

```bash
# Lancer Spring Boot
cd skillhub_auth
mvnw.cmd spring-boot:run

# Lancer Laravel
cd skillhub_back
php artisan serve --host=127.0.0.1 --port=8000
```

---

## 5. Pipeline CI/CD (GitHub Actions)

Declenchement : chaque push sur la branche `dev`.

### Job 1 — Backend (Laravel PHP)
```bash
Setup PHP 8.2
composer install
cp .env.example .env
php artisan key:generate
./vendor/bin/phpunit --log-junit reports/junit.xml
```

### Job 2 — Auth (Spring Boot)
```bash
Setup Java 21
./mvnw test
```

### Job 3 — SonarCloud
```bash
# Checkout complet Git pour le SCM
# Regeneration des rapports backend et auth dans le job d'analyse
sonar-scanner
```

---

## 6. SonarCloud

SonarCloud analyse automatiquement le code a chaque push sur `dev`.

- Projet : `allanahrazanakoto_Skillhub`
- Branche analysee : `dev`
- Security : B | Reliability : B | Maintainability : A
- Duplications : 2.5% (seuil : < 3%)

---

## 7. Tests

### PHPUnit (Backend Laravel)
```bash
cd skillhub_back
./vendor/bin/phpunit
```

| Fichier | Ce qui est teste |
|---------|-----------------|
| `FormationControllerTest` | Creation, modification, droits formateur/apprenant |
| `FormationTest` | Modele Formation (unitaire) |
| `UtilisateurTest` | Modele Utilisateur (unitaire) |

### Maven (Microservice Auth)
```bash
cd skillhub_auth
./mvnw test
```

---

## 8. Workflow Git

```bash
# Toujours travailler sur dev
git checkout dev

# Apres modification
git add -A
git commit -m "feat: description"
git push origin dev

# Merger dans main
git checkout main
git merge dev
git push origin main
git checkout dev
```

### Convention des commits

| Prefixe | Usage |
|---------|-------|
| `feat:` | Nouvelle fonctionnalite |
| `fix:` | Correction de bug |
| `chore:` | Configuration |
| `ci:` | Pipeline CI/CD |
| `test:` | Tests |
| `docs:` | Documentation |

---

## Lancer le projet

```bash
git clone https://github.com/allanahrazanakoto/Skillhub.git
cd Skillhub

# Terminal 1
cd skillhub_auth
mvnw.cmd spring-boot:run

# Terminal 2
cd ../skillhub_back
php artisan serve --host=127.0.0.1 --port=8000

# Ouvrir http://127.0.0.1:8000/api/categories
```