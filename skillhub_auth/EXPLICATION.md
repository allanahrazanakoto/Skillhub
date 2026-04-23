# Explication complète du projet Auth Server TP1 → TP3

## Architecture générale
```
Client Swing → AuthController → AuthService → UserRepository → MySQL
                                           → AuthNonceRepository
                                           → EncryptionService
                                           → HmacService
                                           → TokenService
```

---

## TP1 – Authentification Dangereuse

### Objectif
Créer une authentification volontairement non sécurisée pour comprendre
les risques. Le mot de passe est stocké en clair dans MySQL.

### Ce qui est dangereux
- Mot de passe stocké en clair dans la base de données
- Token basique et rejouable (UUID simple)
- Aucune limite de tentatives de connexion
- Aucune politique de mot de passe (4 caractères minimum seulement)
- Aucun chiffrement des communications

### Fonctionnement TP1
```
Client envoie : email + mot de passe en clair
Serveur vérifie : password == password_en_base ?
Serveur retourne : token UUID simple
```

### Fichiers importants TP1

#### User.java (entity)
Représente la table `users` en base de données.
- `id` : identifiant unique auto-généré
- `email` : unique, sert d'identifiant
- `password` : stocké EN CLAIR (dangereux !)
- `createdAt` : date de création

#### UserRepository.java (repository)
Interface qui parle à MySQL via Spring Data JPA.
- `findByEmail(String email)` : cherche un utilisateur par email

#### AuthService.java (service)
Contient la logique métier.
- `register(email, password)` : inscrit un utilisateur
    - Vérifie que l'email n'existe pas déjà → 409 si conflit
    - Vérifie que le mot de passe fait au moins 4 caractères
    - Sauvegarde en base avec mot de passe EN CLAIR
- `login(email, password)` : connecte un utilisateur
    - Cherche l'utilisateur par email
    - Compare le mot de passe en clair directement
    - Retourne true si OK, false sinon

#### AuthController.java (controller)
Reçoit les requêtes HTTP.
- `POST /api/auth/register` : inscription
- `POST /api/auth/login` : connexion → retourne un token
- `GET /api/me` : route protégée → nécessite un token

#### TokenService.java (service)
Gère les tokens d'authentification.
- `generateToken(email)` : génère un UUID aléatoire
- `isValid(token)` : vérifie si le token existe
- `getEmail(token)` : retourne l'email associé au token

#### GlobalExceptionHandler.java (exception)
Gère les erreurs et retourne des réponses JSON cohérentes.
- 400 : données invalides (InvalidInputException)
- 401 : authentification échouée (AuthenticationFailedException)
- 409 : email déjà existant (ResourceConflictException)

---

## TP2 – Authentification Fragile

### Objectif
Améliorer TP1 avec :
- Mots de passe hashés avec BCrypt
- Politique de mot de passe stricte
- Protection anti brute force

### Ce qui change par rapport à TP1
- `password` devient `passwordHash` (BCrypt)
- Politique : 12 caractères min, majuscule, minuscule, chiffre, spécial
- Après 5 échecs → compte bloqué 2 minutes
- Indicateur de force côté client (Rouge/Orange/Vert)
- Double saisie du mot de passe à l'inscription

### Ce qui reste fragile
Le mot de passe (haché) circule encore sur le réseau lors du login.
Si un attaquant capture la requête, il peut tenter de la rejouer.

### Nouvelles colonnes dans users
- `passwordHash` : mot de passe hashé BCrypt (remplace password)
- `failedAttempts` : nombre de tentatives échouées
- `lockUntil` : date de fin de blocage

### Fonctionnement BCrypt
BCrypt est un algorithme de hachage adaptatif :
- Génère un salt aléatoire à chaque fois
- Hash + salt = passwordHash stocké en base
- `passwordEncoder.matches(password, hash)` compare les deux

---

## TP3 – Authentification Forte

### Objectif
Le mot de passe ne circule PLUS JAMAIS sur le réseau.
Le client prouve qu'il connaît le secret sans l'envoyer.

### Concept clé : HMAC
HMAC = Hash-based Message Authentication Code
- Le client calcule une signature avec le mot de passe comme clé
- Le serveur recalcule la même signature et compare
- Si égales → l'utilisateur connaît le mot de passe
- Le mot de passe lui-même n'est jamais envoyé

### Protocole SSO en 2 étapes

#### Étape 1 : Le client prépare la preuve
```
1. Collecte : email, password, nonce (UUID aléatoire), timestamp
2. Construit le message : email + ":" + nonce + ":" + timestamp
3. Calcule : hmac = HMAC_SHA256(key=password, data=message)
4. Envoie : email, nonce, timestamp, hmac
   → Le mot de passe N'EST PAS envoyé !
```

#### Étape 2 : Le serveur vérifie
```
1. Vérifie que l'email existe → 401 sinon
2. Vérifie que le timestamp est dans ±60 secondes → 401 sinon
3. Vérifie que le nonce n'a pas déjà été utilisé → 401 sinon
4. Enregistre le nonce (anti-rejeu)
5. Déchiffre le mot de passe depuis la base
6. Recalcule le HMAC avec le même message
7. Compare les deux HMAC en temps constant → 401 si différents
8. Retourne accessToken + expiresAt
```

### Pourquoi le nonce ?
Sans nonce, un attaquant pourrait capturer la requête et la renvoyer
(attaque par rejeu). Le nonce est unique à chaque requête, donc
une requête capturée ne peut pas être réutilisée.

### Pourquoi le timestamp ?
Limite la fenêtre d'attaque à ±60 secondes. Même si un attaquant
capture la requête, elle sera invalide après 60 secondes.

### Pourquoi la comparaison en temps constant ?
Une comparaison normale `a.equals(b)` s'arrête dès qu'une différence
est trouvée. Un attaquant peut mesurer le temps de réponse et deviner
le HMAC caractère par caractère. La comparaison en temps constant
compare TOUS les caractères même si une différence est trouvée.

### Chiffrement AES-GCM (Master Key)
Le mot de passe est stocké chiffré en base avec AES-GCM :
- AES = algorithme de chiffrement symétrique
- GCM = mode qui garantit intégrité + chiffrement
- IV = vecteur d'initialisation aléatoire (jamais fixe !)
- Format stocké : `v1:Base64(iv):Base64(ciphertext)`
- La Master Key est injectée via variable d'environnement APP_MASTER_KEY
- La Master Key ne doit JAMAIS être dans le code !

### Nouvelles tables TP3

#### Table users
- `passwordEncrypted` : mot de passe chiffré AES-GCM (remplace passwordHash)

#### Table auth_nonce
- `id` : identifiant unique
- `userId` : lien vers l'utilisateur
- `nonce` : le nonce utilisé
- `expiresAt` : date d'expiration (now + 2 minutes)
- `consumed` : true si déjà utilisé
- `createdAt` : date de création
- Contrainte unique : (user_id, nonce)

### Nouveaux services TP3

#### EncryptionService.java
Chiffre et déchiffre les mots de passe avec AES-GCM.
- `encrypt(plaintext)` : chiffre le mot de passe
- `decrypt(encrypted)` : déchiffre le mot de passe
- Utilise la variable d'environnement APP_MASTER_KEY

#### HmacService.java
Calcule et compare les signatures HMAC.
- `compute(key, message)` : calcule HMAC-SHA256
- `compareConstantTime(a, b)` : compare en temps constant

### Limites du TP3
Ce mécanisme est pédagogique. En industrie :
- On évite de stocker un mot de passe réversible
- On préférerait un hash non réversible et adaptatif
- On accepte le chiffrement réversible ici pour simplifier le protocole

---

## GitHub Actions CI/CD

### Fichier .github/workflows/build.yml
Se déclenche automatiquement à chaque push sur main, tp2, tp3.
1. Checkout du code
2. Installation Java 21
3. Cache Maven (optimisation)
4. Injection de la Master Key fictive pour les tests
5. Build et tests Maven
6. Analyse SonarCloud
   → Bloque si un test échoue ou si le Quality Gate est rouge

---

## SonarCloud

### Ce que SonarCloud analyse
- **Bugs** : comportements incorrects
- **Vulnerabilities** : failles de sécurité
- **Code Smells** : difficultés de maintenance
- **Coverage** : pourcentage de code testé
- **Duplications** : code dupliqué

### Quality Gate
Ensemble de règles qui doivent toutes passer pour valider le code.
Si une règle échoue → le build GitHub Actions échoue aussi.

---

## Tests JUnit

### TP1 : 9 tests
- Inscription OK
- Inscription email déjà existant
- Login OK
- Login mauvais mot de passe
- Login email inconnu
- Email vide
- Mot de passe trop court
- Accès /api/me sans token
- Accès /api/me avec token valide

### TP2 : 10 tests
- Mêmes que TP1 +
- Validation mot de passe sans caractère spécial

### TP3 : 15 tests
- Login OK avec HMAC valide
- Login KO HMAC invalide
- Login KO timestamp expiré
- Login KO timestamp futur
- Login KO nonce déjà utilisé
- Login KO user inconnu
- Comparaison temps constant
- Token émis et /api/me OK
- /api/me sans token KO
- Validation email vide
- Mot de passe trop court
- Mot de passe sans spécial
- Mot de passe sans majuscule
- Inscription OK
- Inscription email déjà existant

---

## Risques de sécurité (Analyse TP1)

1. **Mot de passe en clair** : si la base est compromise,
   tous les mots de passe sont visibles directement.

2. **Token rejouable** : le token UUID peut être capturé
   et réutilisé indéfiniment sans expiration.

3. **Pas de limite de tentatives** : un attaquant peut
   essayer des milliers de mots de passe (brute force).

4. **Pas de chiffrement des communications** : sans HTTPS,
   les données circulent en clair sur le réseau.

5. **Politique de mot de passe faible** : 4 caractères minimum
   permet des mots de passe trivials comme "1234".