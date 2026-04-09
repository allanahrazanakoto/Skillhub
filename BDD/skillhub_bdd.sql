-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : jeu. 09 avr. 2026 à 19:06
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `skillhub_bdd`
--

-- --------------------------------------------------------

--
-- Structure de la table `categorie_formations`
--

DROP TABLE IF EXISTS `categorie_formations`;
CREATE TABLE IF NOT EXISTS `categorie_formations` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categorie_formations_libelle_unique` (`libelle`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `categorie_formations`
--

INSERT INTO `categorie_formations` (`id`, `libelle`, `created_at`, `updated_at`) VALUES
(1, 'Front-end', '2026-03-04 17:58:53', '2026-03-04 17:58:53'),
(2, 'Back-end', '2026-03-04 17:58:53', '2026-03-04 17:58:53'),
(3, 'Sécurité', '2026-03-04 17:58:53', '2026-03-04 17:58:53'),
(4, 'Data Science', '2026-03-04 17:58:53', '2026-03-04 17:58:53'),
(5, 'DevOps', '2026-03-04 17:58:53', '2026-03-04 17:58:53'),
(6, 'Mobile', '2026-03-04 17:58:53', '2026-03-04 17:58:53'),
(7, 'Langage', '2026-03-04 17:58:53', '2026-03-04 17:58:53'),
(8, 'Base de données', '2026-03-04 17:58:53', '2026-03-04 17:58:53'),
(9, 'Cloud', '2026-03-04 17:58:53', '2026-03-04 17:58:53'),
(10, 'Full Stack', '2026-03-04 17:58:53', '2026-03-04 17:58:53');

-- --------------------------------------------------------

--
-- Structure de la table `formations`
--

DROP TABLE IF EXISTS `formations`;
CREATE TABLE IF NOT EXISTS `formations` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_formateur` bigint UNSIGNED NOT NULL,
  `id_categorie` bigint UNSIGNED NOT NULL,
  `nom` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `level` enum('beginner','intermediate','advanced') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duree_heures` decimal(5,2) NOT NULL,
  `prix` decimal(10,2) NOT NULL DEFAULT '0.00',
  `statut` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `formations_id_formateur_foreign` (`id_formateur`),
  KEY `formations_id_categorie_foreign` (`id_categorie`)
) ENGINE=MyISAM AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `inscriptions`
--

DROP TABLE IF EXISTS `inscriptions`;
CREATE TABLE IF NOT EXISTS `inscriptions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `utilisateur_id` bigint UNSIGNED NOT NULL,
  `formation_id` bigint UNSIGNED NOT NULL,
  `progression` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `date_inscription` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inscriptions_utilisateur_id_formation_id_unique` (`utilisateur_id`,`formation_id`),
  KEY `inscriptions_formation_id_foreign` (`formation_id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_03_04_170642_create_users', 1),
(2, '2026_03_04_170721_create_categorie_formation', 1),
(3, '2026_03_04_170743_create_formations', 1),
(4, '2026_03_04_180000_remove_date_heure_description_from_formations', 2),
(5, '2026_03_06_000001_add_title_description_level_to_formations', 3),
(6, '2026_03_06_000002_drop_title_from_formations', 4),
(7, '2026_03_15_100000_add_nombre_de_vues_to_formations', 5),
(8, '2026_03_15_100001_create_modules_table', 5),
(9, '2026_03_15_100002_create_inscriptions_table', 5),
(10, '2026_03_15_100003_drop_modules_table', 6),
(11, '2026_04_09_150000_drop_vue_tracking_from_formations', 7);

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

DROP TABLE IF EXISTS `utilisateurs`;
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('participant','formateur') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'participant',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateurs_email_unique` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
