-- Visual Novel schema for a NEW, EMPTY TiDB Cloud database.
-- Select/create visual_novel_db before running. No DROP/TRUNCATE statements.
-- The circular games <-> game_versions FK is added after both tables exist.

CREATE TABLE `users` (
 `user_id` int NOT NULL AUTO_INCREMENT,
 `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
 `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
 `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
 `display_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
 `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
 `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
 `status` enum('active','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
 `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
 `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`user_id`),
 UNIQUE KEY `username` (`username`),
 UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `games` (
 `game_id` int NOT NULL AUTO_INCREMENT,
 `creator_id` int DEFAULT NULL,
 `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
 `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
 `cover_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
 `thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
 `status` enum('draft','published') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
 `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
 `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 `published_version_id` int DEFAULT NULL,
 PRIMARY KEY (`game_id`),
 KEY `fk_games_creator` (`creator_id`),
 KEY `fk_games_published_version` (`game_id`,`published_version_id`),
 CONSTRAINT `fk_games_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `game_versions` (
 `version_id` int NOT NULL AUTO_INCREMENT,
 `game_id` int NOT NULL,
 `version_number` int NOT NULL,
 `version_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
 `story_snapshot` json NOT NULL,
 `published_at` timestamp DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`version_id`),
 UNIQUE KEY `game_id` (`game_id`,`version_number`),
 UNIQUE KEY `game_id_2` (`game_id`,`version_id`),
 CONSTRAINT `fk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `games`
 ADD CONSTRAINT `fk_games_published_version`
 FOREIGN KEY (`game_id`,`published_version_id`)
 REFERENCES `game_versions` (`game_id`,`version_id`) ON DELETE RESTRICT;

CREATE TABLE `chapters` (
 `chapter_id` int NOT NULL AUTO_INCREMENT,
 `game_id` int NOT NULL,
 `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
 `chapter_order` int NOT NULL,
 `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`chapter_id`),
 UNIQUE KEY `game_id` (`game_id`,`chapter_order`),
 CONSTRAINT `fk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `story_nodes` (
 `node_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
 `chapter_id` int NOT NULL,
 `node_type` enum('start','dialogue','choice','scene','ending') COLLATE utf8mb4_unicode_ci NOT NULL,
 `node_data` json NOT NULL,
 `position_x` float DEFAULT '0',
 `position_y` float DEFAULT '0',
 `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`node_id`),
 KEY `fk_1` (`chapter_id`),
 CONSTRAINT `fk_1` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`chapter_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `story_edges` (
 `edge_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
 `chapter_id` int NOT NULL,
 `source_node_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
 `target_node_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
 `source_handle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
 UNIQUE KEY `source_node_id` (`source_node_id`,`source_handle`),
 PRIMARY KEY (`edge_id`),
 KEY `fk_1` (`chapter_id`),
 KEY `fk_3` (`target_node_id`),
 CONSTRAINT `fk_1` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`chapter_id`) ON DELETE CASCADE,
 CONSTRAINT `fk_2` FOREIGN KEY (`source_node_id`) REFERENCES `story_nodes` (`node_id`) ON DELETE CASCADE,
 CONSTRAINT `fk_3` FOREIGN KEY (`target_node_id`) REFERENCES `story_nodes` (`node_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `assets` (
 `asset_id` int NOT NULL AUTO_INCREMENT,
 `game_id` int NOT NULL,
 `uploaded_by` int NOT NULL,
 `asset_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
 `asset_type` enum('background','character','cover','thumbnail') COLLATE utf8mb4_unicode_ci NOT NULL,
 `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
 `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
 `file_size` bigint unsigned NOT NULL,
 `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`asset_id`),
 KEY `fk_1` (`game_id`),
 KEY `fk_2` (`uploaded_by`),
 CONSTRAINT `fk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE,
 CONSTRAINT `fk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `characters` (
 `character_id` int NOT NULL AUTO_INCREMENT,
 `game_id` int NOT NULL,
 `character_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
 `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
 `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
 `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`character_id`),
 KEY `fk_1` (`game_id`),
 CONSTRAINT `fk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `character_expressions` (
 `expression_id` int NOT NULL AUTO_INCREMENT,
 `character_id` int NOT NULL,
 `asset_id` int NOT NULL,
 `expression_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
 `is_default` tinyint(1) NOT NULL DEFAULT '0',
 PRIMARY KEY (`expression_id`),
 UNIQUE KEY `character_id` (`character_id`,`expression_name`),
 KEY `fk_2` (`asset_id`),
 CONSTRAINT `fk_1` FOREIGN KEY (`character_id`) REFERENCES `characters` (`character_id`) ON DELETE CASCADE,
 CONSTRAINT `fk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `save_slots` (
 `save_id` int NOT NULL AUTO_INCREMENT,
 `user_id` int NOT NULL,
 `game_id` int NOT NULL,
 `version_id` int NOT NULL,
 `slot_number` int NOT NULL,
 `current_node_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
 `save_data` json DEFAULT NULL,
 `saved_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`save_id`),
 UNIQUE KEY `user_id` (`user_id`,`game_id`,`slot_number`),
 KEY `fk_2` (`game_id`,`version_id`),
 CONSTRAINT `fk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
 CONSTRAINT `fk_2` FOREIGN KEY (`game_id`,`version_id`) REFERENCES `game_versions` (`game_id`,`version_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mirrors the source: auto_saves has no declared foreign keys.
CREATE TABLE `auto_saves` (
 `save_id` bigint unsigned NOT NULL AUTO_INCREMENT,
 `user_id` bigint NOT NULL,
 `game_id` bigint NOT NULL,
 `version_id` bigint NOT NULL,
 `current_node_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
 `save_data` json NOT NULL,
 `saved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`save_id`),
 UNIQUE KEY `uq_auto_saves_user_game` (`user_id`,`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `game_categories` (
 `category_id` int NOT NULL AUTO_INCREMENT,
 `category_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
 PRIMARY KEY (`category_id`),
 UNIQUE KEY `uq_category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `game_category_links` (
 `game_id` int NOT NULL,
 `category_id` int NOT NULL,
 PRIMARY KEY (`game_id`,`category_id`),
 KEY `fk_game_category_category` (`category_id`),
 CONSTRAINT `fk_game_category_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE,
 CONSTRAINT `fk_game_category_category` FOREIGN KEY (`category_id`) REFERENCES `game_categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
