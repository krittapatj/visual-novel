const pool = require("../config/db");

const getSaveSlots = async (userId, gameId) => {
  const [rows] = await pool.query(
    `SELECT
       s.save_id,
       s.game_id,
       s.version_id,
       s.slot_number,
       s.current_node_id,
       s.save_data,
       s.saved_at,
       gv.version_number,
       gv.version_name
     FROM save_slots s
     JOIN game_versions gv
       ON gv.game_id = s.game_id
      AND gv.version_id = s.version_id
     WHERE s.user_id = ?
       AND s.game_id = ?
     ORDER BY s.slot_number ASC`,
    [userId, gameId]
  );

  return rows;
};

const getSaveSlot = async (userId, gameId, slotNumber) => {
  const [rows] = await pool.query(
    `SELECT
       s.save_id,
       s.game_id,
       s.version_id,
       s.slot_number,
       s.current_node_id,
       s.save_data,
       s.saved_at,
       gv.version_number,
       gv.version_name,
       gv.story_snapshot
     FROM save_slots s
     JOIN game_versions gv
       ON gv.game_id = s.game_id
      AND gv.version_id = s.version_id
     WHERE s.user_id = ?
       AND s.game_id = ?
       AND s.slot_number = ?
     LIMIT 1`,
    [userId, gameId, slotNumber]
  );

  return rows[0] || null;
};

const getVersion = async (gameId, versionId) => {
  const [rows] = await pool.query(
    `SELECT
       gv.version_id,
       gv.version_number,
       gv.story_snapshot
     FROM game_versions gv
     JOIN games g
       ON g.game_id = gv.game_id
     WHERE gv.game_id = ?
       AND gv.version_id = ?
       AND g.status = 'published'
     LIMIT 1`,
    [gameId, versionId]
  );

  return rows[0] || null;
};

const upsertSaveSlot = async ({
  userId,
  gameId,
  versionId,
  slotNumber,
  currentNodeId,
  saveData,
}) => {
  await pool.query(
    `INSERT INTO save_slots
       (
         user_id,
         game_id,
         version_id,
         slot_number,
         current_node_id,
         save_data
       )
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       version_id = ?,
       current_node_id = ?,
       save_data = ?,
       saved_at = CURRENT_TIMESTAMP`,
    [
      userId,
      gameId,
      versionId,
      slotNumber,
      currentNodeId,
      JSON.stringify(saveData),
      versionId,
      currentNodeId,
      JSON.stringify(saveData),
    ]
  );
};

const deleteSaveSlot = async (
  userId,
  gameId,
  slotNumber
) => {
  const [result] = await pool.query(
    `DELETE FROM save_slots
     WHERE user_id = ?
       AND game_id = ?
       AND slot_number = ?`,
    [userId, gameId, slotNumber]
  );

  return result.affectedRows > 0;
};

// ==============================
// AUTO SAVE
// ==============================

const getAutoSave = async (userId, gameId) => {
  const [rows] = await pool.query(
    `SELECT
       s.save_id,
       s.game_id,
       s.version_id,
       0 AS slot_number,
       s.current_node_id,
       s.save_data,
       s.saved_at,
       gv.version_number,
       gv.version_name,
       gv.story_snapshot
     FROM auto_saves s
     JOIN game_versions gv
       ON gv.game_id = s.game_id
      AND gv.version_id = s.version_id
     WHERE s.user_id = ?
       AND s.game_id = ?
     LIMIT 1`,
    [userId, gameId]
  );

  return rows[0] || null;
};

const upsertAutoSave = async ({
  userId,
  gameId,
  versionId,
  currentNodeId,
  saveData,
}) => {
  await pool.query(
    `INSERT INTO auto_saves
       (
         user_id,
         game_id,
         version_id,
         current_node_id,
         save_data
       )
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       version_id = VALUES(version_id),
       current_node_id = VALUES(current_node_id),
       save_data = VALUES(save_data),
       saved_at = CURRENT_TIMESTAMP`,
    [
      userId,
      gameId,
      versionId,
      currentNodeId,
      JSON.stringify(saveData),
    ]
  );
};

module.exports = {
  getSaveSlots,
  getSaveSlot,
  getVersion,
  upsertSaveSlot,
  deleteSaveSlot,
  getAutoSave,
  upsertAutoSave,
};