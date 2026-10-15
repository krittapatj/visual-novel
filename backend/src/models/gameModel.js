const pool = require('../config/db');

const publicColumns = `
  game_id, creator_id, title, description,
  cover_url, thumbnail_url, status, created_at, updated_at
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

// Creator dashboard always shows the latest saved draft artwork.
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

// Public artwork comes exclusively from the published snapshot.
// Missing/legacy artwork must NOT fall back to the mutable games table.
const publishedArtwork = (snapshotValue) => {
  try {
    const snapshot = typeof snapshotValue === 'string'
      ? JSON.parse(snapshotValue) : snapshotValue;
    return {
      cover_url: snapshot?.game?.coverUrl ?? null,
      thumbnail_url: snapshot?.game?.thumbnailUrl ?? null
    };
  } catch (error) {
    console.error('Unable to parse published artwork snapshot:', error);
    return { cover_url: null, thumbnail_url: null };
  }
};

const getPublishedGames = async () => {
  const [rows] = await pool.query(
    `SELECT g.game_id, g.title, g.description,
            g.cover_url, g.thumbnail_url, g.created_at,
            u.username AS creator_username,
            gv.story_snapshot AS published_snapshot
     FROM games g
     JOIN users u ON u.user_id = g.creator_id
     JOIN game_versions gv ON gv.version_id = g.published_version_id
                          AND gv.game_id = g.game_id
     WHERE g.status = 'published'
       AND g.published_version_id IS NOT NULL
     ORDER BY g.created_at DESC, g.game_id DESC`
  );
  return rows.map(({ published_snapshot, ...game }) => ({
    ...game, ...publishedArtwork(published_snapshot)
  }));
};

const getPublishedGameById = async (gameId) => {
  const [rows] = await pool.execute(
    `SELECT g.game_id, g.title, g.description,
            g.cover_url, g.thumbnail_url, g.created_at,
            u.username AS creator_username,
            gv.story_snapshot AS published_snapshot
     FROM games g
     JOIN users u ON u.user_id = g.creator_id
     JOIN game_versions gv ON gv.version_id = g.published_version_id
                          AND gv.game_id = g.game_id
     WHERE g.game_id = ? AND g.status = 'published'
       AND g.published_version_id IS NOT NULL
     LIMIT 1`, [gameId]
  );
  if (!rows.length) return null;
  const { published_snapshot, ...game } = rows[0];
  return { ...game, ...publishedArtwork(published_snapshot) };
};

// The two image choices must be assets of this game and of the correct type.
const updateGameArtwork = async (gameId, creatorId, coverAssetId, thumbnailAssetId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [games] = await connection.execute(
      'SELECT game_id FROM games WHERE game_id = ? AND creator_id = ? FOR UPDATE',
      [gameId, creatorId]
    );
    if (!games.length) {
      await connection.rollback();
      return { notFound: true };
    }
    const getPath = async (assetId, type) => {
      if (assetId === null) return null;
      const [assets] = await connection.execute(
        'SELECT file_path FROM assets WHERE asset_id = ? AND game_id = ? AND asset_type = ? LIMIT 1',
        [assetId, gameId, type]
      );
      if (!assets.length) throw Object.assign(new Error('Invalid ' + type + ' asset for this game'), { status: 400 });
      return assets[0].file_path;
    };
    const cover = await getPath(coverAssetId, 'cover');
    const thumbnail = await getPath(thumbnailAssetId, 'thumbnail');
    await connection.execute(
      'UPDATE games SET cover_url = ?, thumbnail_url = ? WHERE game_id = ? AND creator_id = ?',
      [cover, thumbnail, gameId, creatorId]
    );
    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  updateGameArtwork,
  createGame,
  getGamesByCreator,
  getGameByOwner,
  updateGame,
  deleteDraftGame,
  getPublishedGames,
  getPublishedGameById
};