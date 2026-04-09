cd skillhub_back

# Installer les dépendances PHP

composer install

# Copier le fichier d'environnement (si .env n'existe pas)

cp .env.example .env

# Générer la clé d'application Laravel

php artisan key:generate

# Générer la clé JWT (si nécessaire, ou si elle n'est pas dans .env)

php artisan jwt:secret

# Configurer la base de données dans .env (assurez-vous que MySQL est démarré et que la DB existe)

# Exemple : DB_DATABASE=skillhub_bdd, DB_USERNAME=root, DB_PASSWORD=

# Exécuter les migrations pour créer les tables

php artisan migrate

# (Optionnel) Exécuter les seeders si vous voulez des données de test

php artisan db:seed
