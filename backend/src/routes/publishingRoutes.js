const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const publishingController = require('../controllers/publishingController');

router.post(
  '/creator/games/:gameId/publish',
  authMiddleware,
  publishingController.publishGame
);

router.get(
  '/creator/games/:gameId/versions',
  authMiddleware,
  publishingController.getGameVersions
);

module.exports = router;