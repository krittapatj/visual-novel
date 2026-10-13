const gameModel = require('../models/gameModel');
const categoryModel = require('../models/categoryModel');

const parseGameId = (value) => {
  const id = Number(value);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
};

const validateGameData = (body) => {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const { title, description = '' } = body;

  if (
    typeof title !== 'string' ||
    typeof description !== 'string'
  ) {
    return null;
  }

  const cleanTitle = title.trim();
  const cleanDescription = description.trim();

  if (
    cleanTitle.length < 1 ||
    cleanTitle.length > 255 ||
    cleanDescription.length > 5000
  ) {
    return null;
  }

  return {
    title: cleanTitle,
    description: cleanDescription
  };
};

// POST /api/creator/games
const createGame = async (req, res) => {
  try {
    const data = validateGameData(req.body);

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game title or description'
      });
    }

    const gameId = await gameModel.createGame(
      req.user.userId,
      data.title,
      data.description
    );

    const game = await gameModel.getGameByOwner(
      gameId,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: 'Game created successfully',
      game
    });

  } catch (error) {
    console.error('Create game error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/creator/games
const getMyGames = async (req, res) => {
  try {
    const games = await gameModel.getGamesByCreator(
      req.user.userId
    );

    return res.json({
      success: true,
      count: games.length,
      games
    });

  } catch (error) {
    console.error('Get games error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/creator/games/:id
const getMyGameById = async (req, res) => {
  try {
    const gameId = parseGameId(req.params.id);

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

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

    return res.json({
      success: true,
      game
    });

  } catch (error) {
    console.error('Get game error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PUT /api/creator/games/:id
const updateGame = async (req, res) => {
  try {
    const gameId = parseGameId(req.params.id);
    const data = validateGameData(req.body);

    if (!gameId || !data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID or game data'
      });
    }

    const affectedRows = await gameModel.updateGame(
      gameId,
      req.user.userId,
      data.title,
      data.description
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const game = await gameModel.getGameByOwner(
      gameId,
      req.user.userId
    );

    return res.json({
      success: true,
      message: 'Game updated successfully',
      game
    });

  } catch (error) {
    console.error('Update game error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// DELETE /api/creator/games/:id
const deleteGame = async (req, res) => {
  try {
    const gameId = parseGameId(req.params.id);

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

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

    if (
      game.status !== 'draft' ||
      game.published_version_id !== null
    ) {
      return res.status(409).json({
        success: false,
        message: 'Only unpublished draft games can be deleted'
      });
    }

    const deleted = await gameModel.deleteDraftGame(
      gameId,
      req.user.userId
    );

    if (!deleted) {
      return res.status(409).json({
        success: false,
        message: 'Game could not be deleted'
      });
    }

    return res.json({
      success: true,
      message: 'Game deleted successfully'
    });

  } catch (error) {
    console.error('Delete game error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/games

const getPublishedGames = async (req, res) => {
  try {
    const games = await gameModel.getPublishedGames();

    const gameIds = games.map((game) => game.game_id);

    const categoriesByGame =
      await categoryModel.getCategoriesForGames(gameIds);

    const gamesWithCategories = games.map((game) => ({
      ...game,
      categories: categoriesByGame[game.game_id] || []
    }));

    return res.json({
      success: true,
      count: gamesWithCategories.length,
      games: gamesWithCategories
    });
  } catch (error) {
    console.error('Public games error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// GET /api/games/:id

const getPublishedGameById = async (req, res) => {
  try {
    const gameId = parseGameId(req.params.id);

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    const game = await gameModel.getPublishedGameById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Published game not found'
      });
    }

    const categories =
      await categoryModel.getGameCategories(gameId);

    return res.json({
      success: true,
      game: {
        ...game,
        categories
      }
    });
  } catch (error) {
    console.error('Public game error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


module.exports = {
  createGame,
  getMyGames,
  getMyGameById,
  updateGame,
  deleteGame,
  getPublishedGames,
  getPublishedGameById
};