
const pool = require('../config/db');

const getCategories = async () => {
  const [rows] = await pool.query(`
    SELECT category_id, category_name
    FROM game_categories
    ORDER BY category_name ASC
  `);

  return rows;
};

const getGameCategories = async (gameId) => {
  const [rows] = await pool.query(
    `SELECT c.category_id, c.category_name
     FROM game_categories c
     JOIN game_category_links l
       ON c.category_id = l.category_id
     WHERE l.game_id = ?
     ORDER BY c.category_name ASC`,
    [gameId]
  );

  return rows;
};

const getCategoriesForGames = async (gameIds) => {
  if (gameIds.length === 0) return {};

  const placeholders = gameIds.map(() => '?').join(',');

  const [rows] = await pool.query(
    `SELECT l.game_id, c.category_id, c.category_name
     FROM game_category_links l
     JOIN game_categories c
       ON c.category_id = l.category_id
     WHERE l.game_id IN (${placeholders})
     ORDER BY c.category_name ASC`,
    gameIds
  );

  return rows.reduce((result, row) => {
    if (!result[row.game_id]) {
      result[row.game_id] = [];
    }

    result[row.game_id].push({
      category_id: row.category_id,
      category_name: row.category_name
    });

    return result;
  }, {});
};

const setGameCategories = async (
  gameId,
  creatorId,
  categoryIds
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [games] = await connection.query(
      `SELECT game_id
       FROM games
       WHERE game_id = ? AND creator_id = ?
       FOR UPDATE`,
      [gameId, creatorId]
    );

    if (games.length === 0) {
      await connection.rollback();
      return 'not_found';
    }

    if (categoryIds.length > 0) {
      const placeholders = categoryIds
        .map(() => '?')
        .join(',');

      const [categories] = await connection.query(
        `SELECT category_id
         FROM game_categories
         WHERE category_id IN (${placeholders})`,
        categoryIds
      );

      if (categories.length !== categoryIds.length) {
        await connection.rollback();
        return 'invalid_categories';
      }
    }

    await connection.query(
      `DELETE FROM game_category_links
       WHERE game_id = ?`,
      [gameId]
    );

    for (const categoryId of categoryIds) {
      await connection.query(
        `INSERT INTO game_category_links
           (game_id, category_id)
         VALUES (?, ?)`,
        [gameId, categoryId]
      );
    }

    await connection.commit();
    return 'success';
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getCategories,
  getGameCategories,
  getCategoriesForGames,
  setGameCategories
};
