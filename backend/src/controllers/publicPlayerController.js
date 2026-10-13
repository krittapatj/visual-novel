
const publicPlayerModel = require('../models/publicPlayerModel');

const parseGameId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

const parseSnapshot = (value) => {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }

  return value;
};

// GET /api/games/:id/play
const getPublishedGameForPlay = async (req, res) => {
  try {
    const gameId = parseGameId(req.params.id);

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    const published =
      await publicPlayerModel.getPublishedGameSnapshot(gameId);

    if (!published) {
      return res.status(404).json({
        success: false,
        message: 'Published game not found'
      });
    }

    const snapshot = parseSnapshot(published.story_snapshot);

    if (
      !snapshot ||
      typeof snapshot !== 'object' ||
      !Array.isArray(snapshot.chapters)
    ) {
      console.error(
        'Invalid published snapshot:',
        published.version_id
      );

      return res.status(500).json({
        success: false,
        message: 'Published game data is invalid'
      });
    }

    const chapters = [...snapshot.chapters].sort(
      (a, b) => a.chapterOrder - b.chapterOrder
    );

    return res.json({
      success: true,
      game: snapshot.game,
      version: {
        versionId: published.version_id,
        versionNumber: published.version_number,
        versionName: published.version_name,
        publishedAt: published.published_at
      },
      chapters,
      assets: Array.isArray(snapshot.assets)
        ? snapshot.assets
        : [],
      characters: Array.isArray(snapshot.characters)
        ? snapshot.characters
        : []
    });

  } catch (error) {
    console.error('Get published game for play error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getPublishedGameForPlay
};
