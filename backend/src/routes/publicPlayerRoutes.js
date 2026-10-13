const express = require('express');

const router = express.Router();

const publicPlayerController = require(
  '../controllers/publicPlayerController'
);

router.get(
  '/games/:id/play',
  publicPlayerController.getPublishedGameForPlay
);

module.exports = router;