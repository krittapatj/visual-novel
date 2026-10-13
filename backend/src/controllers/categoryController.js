
const categoryModel = require('../models/categoryModel');
const gameModel = require('../models/gameModel');

const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getCategories();

    return res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getGameCategories = async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isSafeInteger(gameId) || gameId <= 0) {
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
      categories
    });
  } catch (error) {
    console.error('Get game categories error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateGameCategories = async (req, res) => {
  try {
    const gameId = Number(req.params.id);
    const categoryIds = req.body?.categoryIds;

    if (!Number.isSafeInteger(gameId) || gameId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    if (
      !Array.isArray(categoryIds) ||
      categoryIds.length > 5 ||
      categoryIds.some(
        (id) =>
          !Number.isSafeInteger(id) || id <= 0
      ) ||
      new Set(categoryIds).size !== categoryIds.length
    ) {
      return res.status(400).json({
        success: false,
        message: 'Select up to 5 valid categories'
      });
    }

    const result = await categoryModel.setGameCategories(
      gameId,
      req.user.userId,
      categoryIds
    );

    if (result === 'not_found') {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (result === 'invalid_categories') {
      return res.status(400).json({
        success: false,
        message: 'One or more categories do not exist'
      });
    }

    const categories =
      await categoryModel.getGameCategories(gameId);

    return res.json({
      success: true,
      message: 'Game categories updated successfully',
      categories
    });
  } catch (error) {
    console.error('Update categories error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getMyGameCategories = async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isSafeInteger(gameId) || gameId <= 0) {
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

    const categories =
      await categoryModel.getGameCategories(gameId);

    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Get creator categories error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCategories,
  getGameCategories,
  updateGameCategories,
  getMyGameCategories
};
