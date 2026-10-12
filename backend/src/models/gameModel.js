const pool = require('../config/db');

const publicColumns = `
  game_id, creator_id, title, description,
  cover_url, status, created_at, updated_at
`;

const createGame = async (creatorId, title, description) => {
  const [result] = await pool.execute(
    `INSERT INTO games
      (creator_id, title, description, status)
     VALUES (?, ?, ?, 'draft')`,
    [creatorId, title, description]
  );

  return result.insertId;
};

const getGamesByCreator = async (creatorId) => {
  const [rows] = await pool.execute(
    `SELECT ${publicColumns}
     FROM games
     WHERE creator_id = ?
     ORDER BY created_at DESC, game_id DESC`,
    [creatorId]
  );

  return rows;
};

const getGameByOwner = async (gameId, creatorId) => {
  const [rows] = await pool.execute(
    `SELECT ${publicColumns}, published_version_id
     FROM games
     WHERE game_id = ? AND creator_id = ?
     LIMIT 1`,
    [gameId, creatorId]
  );

  return rows[0] || null;
};

const updateGame = async (
  gameId,
  creatorId,
  title,
  description
) => {
  const [result] = await pool.execute(
    `UPDATE games
     SET title = ?, description = ?
     WHERE game_id = ? AND creator_id = ?`,
    [title, description, gameId, creatorId]
  );

  return result.affectedRows;
};

const deleteDraftGame = async (gameId, creatorId) => {
  const [result] = await pool.execute(
    `DELETE FROM games
     WHERE game_id = ?
       AND creator_id = ?
       AND status = 'draft'
       AND published_version_id IS NULL`,
    [gameId, creatorId]
  );

  return result.affectedRows;
};

const getPublishedGames = async () => {
  const [rows] = await pool.query(
    `SELECT
       g.game_id, g.title, g.description,
       g.cover_url, g.created_at,
       u.username AS creator_username
     FROM games g
     JOIN users u ON u.user_id = g.creator_id
     WHERE g.status = 'published'
       AND g.published_version_id IS NOT NULL
     ORDER BY g.created_at DESC, g.game_id DESC`
  );

  return rows;
};

const getPublishedGameById = async (gameId) => {
  const [rows] = await pool.execute(
    `SELECT
       g.game_id, g.title, g.description,
       g.cover_url, g.created_at,
       u.username AS creator_username
     FROM games g
     JOIN users u ON u.user_id = g.creator_id
     WHERE g.game_id = ?
       AND g.status = 'published'
       AND g.published_version_id IS NOT NULL
     LIMIT 1`,
    [gameId]
  );

  return rows[0] || null;
};

module.exports = {
  createGame,
  getGamesByCreator,
  getGameByOwner,
  updateGame,
  deleteDraftGame,
  getPublishedGames,
  getPublishedGameById
};