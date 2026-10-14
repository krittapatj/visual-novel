
const publishingModel = require('../models/publishingModel');

const {
  validateStoryGraph
} = require('../services/storyValidationService');

const parseGameId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

// POST /api/creator/games/:gameId/publish
const publishGame = async (req, res) => {
  const gameId = parseGameId(req.params.gameId);

  if (!gameId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid game ID'
    });
  }

  const rawVersionName = req.body?.versionName;

  if (
    rawVersionName !== undefined &&
    (typeof rawVersionName !== 'string' ||
      rawVersionName.trim().length > 100)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid version name'
    });
  }

  const connection = await publishingModel.pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verify ownership and lock game
    const game = await publishingModel.getGameForPublish(
      connection,
      gameId,
      req.user.userId
    );

    if (!game) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // 2. Load chapters
    const chapters = await publishingModel.getChaptersForPublish(
      connection,
      gameId
    );

    if (chapters.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: 'Game must contain at least one chapter'
      });
    }

    // 3. Build and validate chapters
    const snapshotChapters = [];
    const validationErrors = [];

    for (const chapter of chapters) {
      const nodes = await publishingModel.getStoryNodes(
        connection,
        chapter.chapter_id
      );

      const edges = await publishingModel.getStoryEdges(
        connection,
        chapter.chapter_id
      );

      const validation = validateStoryGraph(nodes, edges);

      if (!validation.valid) {
        validationErrors.push({
          chapterId: chapter.chapter_id,
          chapterTitle: chapter.title,
          errors: validation.errors
        });
      }

      snapshotChapters.push({
        chapterId: chapter.chapter_id,
        title: chapter.title,
        chapterOrder: chapter.chapter_order,
        nodes,
        edges
      });
    }

    if (validationErrors.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: 'Story validation failed',
        errors: validationErrors
      });
    }

    // 4. Load assets and characters
    const [assets, characters] = await Promise.all([
      publishingModel.getAssetsForPublish(connection, gameId),
      publishingModel.getCharactersForPublish(connection, gameId)
    ]);

    // 5. Create version number
    const versionNumber =
      await publishingModel.getNextVersionNumber(
        connection,
        gameId
      );

    const versionName =
      rawVersionName?.trim() || `Version ${versionNumber}`;

    // 6. Build snapshot
    const snapshot = {
      schemaVersion: 1,
      game: {
        gameId: game.game_id,
        title: game.title,
        description: game.description,
        coverUrl: game.cover_url ?? null,
        thumbnailUrl: game.thumbnail_url ?? null
      },
      chapters: snapshotChapters,
      assets,
      characters
    };

    // 7. Save published version
    const versionId = await publishingModel.insertVersion(
      connection,
      gameId,
      versionNumber,
      versionName,
      snapshot
    );

    // 8. Update game
    await publishingModel.markGamePublished(
      connection,
      gameId,
      versionId
    );

    // 9. Commit
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Game published successfully',
      version: {
        versionId,
        versionNumber,
        versionName
      }
    });

  } catch (error) {
    await connection.rollback();

    console.error('Publish game error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });

  } finally {
    connection.release();
  }
};

// GET /api/creator/games/:gameId/versions
const getGameVersions = async (req, res) => {
  try {
    const gameId = parseGameId(req.params.gameId);

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    const gameModel = require('../models/gameModel');

    const game = await gameModel.getGameByOwner(
      gameId,
      req.user.userId
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const versions = await publishingModel.getVersions(
      gameId,
      req.user.userId
    );

    return res.json({
      success: true,
      count: versions.length,
      versions
    });

  } catch (error) {
    console.error('Get game versions error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  publishGame,
  getGameVersions
};
