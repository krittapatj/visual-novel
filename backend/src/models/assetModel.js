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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [assets] = await connection.execute(
      'SELECT file_path FROM assets WHERE asset_id = ? AND game_id = ? FOR UPDATE',
      [assetId, gameId]
    );
    if (!assets.length) {
      await connection.rollback();
      return 0;
    }
    const [result] = await connection.execute(
      'DELETE FROM assets WHERE asset_id = ? AND game_id = ?', [assetId, gameId]
    );
    await connection.execute(
      'UPDATE games SET cover_url = CASE WHEN cover_url = ? THEN NULL ELSE cover_url END, thumbnail_url = CASE WHEN thumbnail_url = ? THEN NULL ELSE thumbnail_url END WHERE game_id = ?',
      [assets[0].file_path, assets[0].file_path, gameId]
    );
    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getGameByOwner,
  createAsset,
  getAssetsByGame,
  getAssetById,
  deleteAsset
};