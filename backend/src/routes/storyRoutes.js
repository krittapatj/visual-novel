const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const storyController = require('../controllers/storyController');

router.use(authMiddleware);

router.get(
  '/chapters/:chapterId/graph',
  storyController.getGraph
);

router.put(
  '/chapters/:chapterId/graph',
  storyController.saveGraph
);

module.exports = router;