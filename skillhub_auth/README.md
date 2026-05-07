# Auth Server – TP1

## Comment lancer MySQL et configurer application.properties

Le projet est configuré pour un lancement local sans Docker avec MySQL local :

- hôte : `127.0.0.1`
- port : `3306`
- base : `authdb`
- utilisateur : `root`
- mot de passe : vide par défaut

La base est créée automatiquement au lancement si elle n'existe pas.

## Comment lancer l'API
`mvnw.cmd spring-boot:run`

## Comment lancer le client Java
(à compléter)

## Compte de test
- Email : toto@example.com
- Mot de passe : pwd1234

## Analyse de sécurité TP1
1. Mot de passe stocké en clair en base
2. Pas de chiffrement des communications
3. Pas de limite de tentatives de connexion
4. Token basique rejouable
5. Aucune politique de mot de passe