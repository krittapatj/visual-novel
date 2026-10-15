-- Seed data: only standard game categories. Safe to re-run without duplicating rows.
INSERT INTO `game_categories` (`category_id`, `category_name`) VALUES
 (1, 'Romance'),
 (2, 'Fantasy'),
 (3, 'Mystery'),
 (4, 'Horror'),
 (5, 'Adventure'),
 (6, 'Drama'),
 (7, 'Comedy'),
 (8, 'Sci-Fi'),
 (9, 'Slice of Life'),
 (10, 'Action')
ON DUPLICATE KEY UPDATE `category_name` = VALUES(`category_name`);
