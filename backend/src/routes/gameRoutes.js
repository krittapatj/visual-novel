const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const gameController = require('../controllers/gameController');

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

module.exports = router;