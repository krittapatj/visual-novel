
const pool = require('../config/db');

const parseJson = (value) => {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }

  return value;
};

const getGameForPublish = async (connection, gameId, userId) => {
  const [rows] = await connection.query(
    `SELECT *
     FROM games
     WHERE game_id = ?
       AND creator_id = ?
     FOR UPDATE`,
    [gameId, userId]
  );

  return rows[0] || null;
};

const getChaptersForPublish = async (connection, gameId) => {
  const [rows] = await connection.query(
    `SELECT chapter_id, game_id, title, chapter_order
     FROM chapters
     WHERE game_id = ?
     ORDER BY chapter_order ASC`,
    [gameId]
  );

  return rows;
};

const getStoryNodes = async (connection, chapterId) => {
  const [rows] = await connection.query(
    `SELECT node_id, node_type, node_data,
            position_x, position_y
     FROM story_nodes
     WHERE chapter_id = ?`,
    [chapterId]
  );

  return rows.map((row) => ({
    id: row.node_id,
    type: row.node_type,
    position: {
      x: row.position_x,
      y: row.position_y
    },
    data: {
      ...parseJson(row.node_data),
      nodeType: row.node_type
    }
  }));
};

const getStoryEdges = async (connection, chapterId) => {
  const [rows] = await connection.query(
    `SELECT edge_id, source_node_id,
            target_node_id, source_handle
     FROM story_edges
     WHERE chapter_id = ?`,
    [chapterId]
  );

  return rows.map((row) => ({
    id: row.edge_id,
    source: row.source_node_id,
    target: row.target_node_id,
    sourceHandle: row.source_handle
  }));
};

const getAssetsForPublish = async (connection, gameId) => {
  const [rows] = await connection.query(
    `SELECT asset_id, asset_name, asset_type,
            file_path, mime_type
     FROM assets
     WHERE game_id = ?`,
    [gameId]
  );

  return rows;
};

const getCharactersForPublish = async (connection, gameId) => {
  const [characters] = await connection.query(
    `SELECT character_id, character_name, description
     FROM characters
     WHERE game_id = ?`,
    [gameId]
  );

  const [expressions] = await connection.query(
    `SELECT ce.expression_id,
            ce.character_id,
            ce.asset_id,
            ce.expression_name,
            ce.is_default,
            a.file_path
     FROM character_expressions ce
     JOIN characters c
       ON c.character_id = ce.character_id
     JOIN assets a
       ON a.asset_id = ce.asset_id
     WHERE c.game_id = ?`,
    [gameId]
  );

  return characters.map((character) => ({
    ...character,
    expressions: expressions.filter(
      (expression) =>
        expression.character_id === character.character_id
    )
  }));
};

const getNextVersionNumber = async (connection, gameId) => {
  const [rows] = await connection.query(
    `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
     FROM game_versions
     WHERE game_id = ?`,
    [gameId]
  );

  return rows[0].next_version;
};

const insertVersion = async (
  connection,
  gameId,
  versionNumber,
  versionName,
  snapshot
) => {
  const [result] = await connection.query(
    `INSERT INTO game_versions
       (game_id, version_number, version_name, story_snapshot)
     VALUES (?, ?, ?, ?)`,
    [
      gameId,
      versionNumber,
      versionName,
      JSON.stringify(snapshot)
    ]
  );

  return result.insertId;
};

const markGamePublished = async (
  connection,
  gameId,
  versionId
) => {
  await connection.query(
    `UPDATE games
     SET status = 'published',
         published_version_id = ?
     WHERE game_id = ?`,
    [versionId, gameId]
  );
};

const getVersions = async (gameId, userId) => {
  const [rows] = await pool.query(
    `SELECT gv.version_id,
            gv.game_id,
            gv.version_number,
            gv.version_name,
            gv.published_at
     FROM game_versions gv
     JOIN games g ON g.game_id = gv.game_id
     WHERE gv.game_id = ?
       AND g.creator_id = ?
     ORDER BY gv.version_number DESC`,
    [gameId, userId]
  );

  return rows;
};

module.exports = {
  pool,
  getGameForPublish,
  getChaptersForPublish,
  getStoryNodes,
  getStoryEdges,
  getAssetsForPublish,
  getCharactersForPublish,
  getNextVersionNumber,
  insertVersion,
  markGamePublished,
  getVersions
};
