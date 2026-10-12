
const pool = require("../config/db");

const getOwnedGame = async (gameId, userId) => {
  const [rows] = await pool.execute(
    `SELECT game_id FROM games
     WHERE game_id = ? AND creator_id = ?
     LIMIT 1`,
    [gameId, userId]
  );
  return rows[0] || null;
};

const getCharacters = async (gameId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM characters
     WHERE game_id = ?
     ORDER BY character_id DESC`,
    [gameId]
  );
  return rows;
};

const getCharacter = async (gameId, characterId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM characters
     WHERE game_id = ? AND character_id = ?
     LIMIT 1`,
    [gameId, characterId]
  );
  return rows[0] || null;
};

const createCharacter = async (gameId, name, description) => {
  const [result] = await pool.execute(
    `INSERT INTO characters
     (game_id, character_name, description)
     VALUES (?, ?, ?)`,
    [gameId, name, description]
  );
  return result.insertId;
};

const updateCharacter = async (gameId, characterId, name, description) => {
  const [result] = await pool.execute(
    `UPDATE characters
     SET character_name = ?, description = ?
     WHERE game_id = ? AND character_id = ?`,
    [name, description, gameId, characterId]
  );
  return result.affectedRows;
};

const deleteCharacter = async (gameId, characterId) => {
  const [result] = await pool.execute(
    `DELETE FROM characters
     WHERE game_id = ? AND character_id = ?`,
    [gameId, characterId]
  );
  return result.affectedRows;
};

const getExpressions = async (characterId) => {
  const [rows] = await pool.execute(
    `SELECT
       ce.expression_id,
       ce.character_id,
       ce.asset_id,
       ce.expression_name,
       ce.is_default,
       a.asset_name,
       a.file_path
     FROM character_expressions ce
     JOIN assets a ON a.asset_id = ce.asset_id
     WHERE ce.character_id = ?
     ORDER BY ce.is_default DESC, ce.expression_id ASC`,
    [characterId]
  );
  return rows;
};

const getCharacterAsset = async (gameId, assetId) => {
  const [rows] = await pool.execute(
    `SELECT asset_id FROM assets
     WHERE game_id = ?
       AND asset_id = ?
       AND asset_type = 'character'
     LIMIT 1`,
    [gameId, assetId]
  );
  return rows[0] || null;
};

const saveExpression = async (
  characterId,
  assetId,
  expressionName,
  isDefault
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (isDefault) {
      await connection.execute(
        `UPDATE character_expressions
         SET is_default = 0
         WHERE character_id = ?`,
        [characterId]
      );
    }

    await connection.execute(
      `INSERT INTO character_expressions
       (character_id, asset_id, expression_name, is_default)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         asset_id = VALUES(asset_id),
         is_default = VALUES(is_default)`,
      [characterId, assetId, expressionName, isDefault ? 1 : 0]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteExpression = async (characterId, expressionId) => {
  const [result] = await pool.execute(
    `DELETE FROM character_expressions
     WHERE character_id = ? AND expression_id = ?`,
    [characterId, expressionId]
  );
  return result.affectedRows;
};

module.exports = {
  getOwnedGame,
  getCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getExpressions,
  getCharacterAsset,
  saveExpression,
  deleteExpression
};
