const pool = require('../config/db');

const getOwnedGame = async (gameId, userId) => {
  const [rows] = await pool.execute(
    `SELECT game_id
     FROM games
     WHERE game_id = ? AND creator_id = ?
     LIMIT 1`,
    [gameId, userId]
  );

  return rows[0] || null;
};

const getOwnedChapter = async (chapterId, userId) => {
  const [rows] = await pool.execute(
    `SELECT c.*
     FROM chapters c
     JOIN games g ON c.game_id = g.game_id
     WHERE c.chapter_id = ?
       AND g.creator_id = ?
     LIMIT 1`,
    [chapterId, userId]
  );

  return rows[0] || null;
};

const createChapter = async (gameId, title, order) => {
  const [result] = await pool.execute(
    `INSERT INTO chapters
       (game_id, title, chapter_order)
     VALUES (?, ?, ?)`,
    [gameId, title, order]
  );

  return result.insertId;
};

const getChapters = async (gameId) => {
  const [rows] = await pool.execute(
    `SELECT *
     FROM chapters
     WHERE game_id = ?
     ORDER BY chapter_order ASC`,
    [gameId]
  );

  return rows;
};

const updateChapter = async (chapterId, title, order) => {
  await pool.execute(
    `UPDATE chapters
     SET title = ?, chapter_order = ?
     WHERE chapter_id = ?`,
    [title, order, chapterId]
  );
};

const deleteChapter = async (chapterId) => {
  const [result] = await pool.execute(
    `DELETE FROM chapters WHERE chapter_id = ?`,
    [chapterId]
  );

  return result.affectedRows;
};

module.exports = {
  getOwnedGame,
  getOwnedChapter,
  createChapter,
  getChapters,
  updateChapter,
  deleteChapter
};