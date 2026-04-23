-- Ce script s'exécute automatiquement au premier démarrage de MySQL dans Docker.
-- Il crée la base de données "authdb" utilisée par le microservice Spring Boot Auth.
-- La base "skillhub" est déjà créée via la variable MYSQL_DATABASE.

CREATE DATABASE IF NOT EXISTS authdb
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- On donne tous les droits à l'utilisateur skillhub sur les deux bases
GRANT ALL PRIVILEGES ON authdb.* TO 'skillhub'@'%';
FLUSH PRIVILEGES;
