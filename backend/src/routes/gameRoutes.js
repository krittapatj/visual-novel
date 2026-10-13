const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const gameController = require('../controllers/gameController');
const categoryController = require('../controllers/categoryController');

// Creator routes: ต้อง Login
router.post(
  '/creator/games',
  authMiddleware,
  gameController.createGame
);

router.get(
  '/creator/games',
  authMiddleware,
  gameController.getMyGames
);

router.get(
  '/creator/games/:id',
  authMiddleware,
  gameController.getMyGameById
);

router.put(
  '/creator/games/:id',
  authMiddleware,
  gameController.updateGame
);

router.delete(
  '/creator/games/:id',
  authMiddleware,
  gameController.deleteGame
);

// Public routes: ไม่ต้อง Login
router.get(
  '/games',
  gameController.getPublishedGames
);

router.get(
  '/games/:id',
  gameController.getPublishedGameById
);

// Public: List all categories
router.get(
  '/categories',
  categoryController.getCategories
);

// Public: Categories of a published game
router.get(
  '/games/:id/categories',
  categoryController.getGameCategories
);

// Creator: Update categories of owned game
router.put(
  '/creator/games/:id/categories',
  authMiddleware,
  categoryController.updateGameCategories
);

router.get(
  '/creator/games/:id/categories',
  authMiddleware,
  categoryController.getMyGameCategories
);


module.exports = router;