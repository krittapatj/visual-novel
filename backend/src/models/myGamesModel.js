const pool = require("../config/db");

const getMyPlayedGames = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT
       g.game_id, g.title, g.description,
       g.cover_url, g.thumbnail_url, g.published_version_id,
       gv.story_snapshot AS published_snapshot,
       u.username AS creator_username,
       s.last_played_at, s.has_auto_save, s.manual_slot_count
     FROM games g
     JOIN users u ON u.user_id = g.creator_id
     LEFT JOIN game_versions gv
       ON gv.game_id = g.game_id AND gv.version_id = g.published_version_id
     JOIN (
       SELECT saves.game_id,
              MAX(saves.saved_at) AS last_played_at,
              MAX(saves.is_auto_save) AS has_auto_save,
              COUNT(DISTINCT saves.slot_number) AS manual_slot_count
       FROM (
         SELECT game_id, saved_at, slot_number, 0 AS is_auto_save
         FROM save_slots WHERE user_id = ?
         UNION ALL
         SELECT game_id, saved_at, NULL AS slot_number, 1 AS is_auto_save
         FROM auto_saves WHERE user_id = ?
       ) saves
       GROUP BY saves.game_id
     ) s ON s.game_id = g.game_id
     WHERE g.status = 'published' AND g.published_version_id IS NOT NULL
     ORDER BY s.last_played_at DESC, g.game_id DESC`,
    [userId, userId]
  );
  return rows;
};

module.exports = { getMyPlayedGames };
