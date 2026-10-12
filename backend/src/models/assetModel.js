const pool = require('../config/db');

const getGameByOwner = async (gameId, userId) => {
  const [rows] = await pool.execute(
    `SELECT game_id
     FROM games
     WHERE game_id = ? AND creator_id = ?
     LIMIT 1`,
    [gameId, userId]
  );

  return rows[0] || null;
};

const createAsset = async ({
  gameId,
  userId,
  name,
  type,
  filePath,
  mimeType,
  fileSize
}) => {
  const [result] = await pool.execute(
    `INSERT INTO assets
      (game_id, uploaded_by, asset_name, asset_type,
       file_path, mime_type, file_size)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      gameId,
      userId,
      name,
      type,
      filePath,
      mimeType,
      fileSize
    ]
  );

  return result.insertId;
};

const getAssetsByGame = async (gameId) => {
  const [rows] = await pool.execute(
    `SELECT *
     FROM assets
     WHERE game_id = ?
     ORDER BY created_at DESC, asset_id DESC`,
    [gameId]
  );

  return rows;
};

const getAssetById = async (assetId, gameId) => {
  const [rows] = await pool.execute(
    `SELECT *
     FROM assets
     WHERE asset_id = ? AND game_id = ?
     LIMIT 1`,
    [assetId, gameId]
  );

  return rows[0] || null;
};

const deleteAsset = async (assetId, gameId) => {
  const [result] = await pool.execute(
    `DELETE FROM assets
     WHERE asset_id = ? AND game_id = ?`,
    [assetId, gameId]
  );

  return result.affectedRows;
};

module.exports = {
  getGameByOwner,
  createAsset,
  getAssetsByGame,
  getAssetById,
  deleteAsset
};