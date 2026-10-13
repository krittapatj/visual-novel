
const pool = require('../config/db');

const getPublishedGameSnapshot = async (gameId) => {
  const [rows] = await pool.query(
    `SELECT
       g.game_id,
       g.status,
       g.published_version_id,
       gv.version_id,
       gv.version_number,
       gv.version_name,
       gv.story_snapshot,
       gv.published_at
     FROM games g
     INNER JOIN game_versions gv
       ON gv.game_id = g.game_id
      AND gv.version_id = g.published_version_id
     WHERE g.game_id = ?
       AND g.status = 'published'
       AND g.published_version_id IS NOT NULL
     LIMIT 1`,
    [gameId]
  );

  return rows[0] || null;
};

module.exports = {
  getPublishedGameSnapshot
};
