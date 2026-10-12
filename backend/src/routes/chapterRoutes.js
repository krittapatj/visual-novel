const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const chapterController = require('../controllers/chapterController');

router.use(authMiddleware);

router.post(
  '/games/:gameId/chapters',
  chapterController.createChapter
);

router.get(
  '/games/:gameId/chapters',
  chapterController.getChapters
);

router.put(
  '/chapters/:chapterId',
  chapterController.updateChapter
);

router.delete(
  '/chapters/:chapterId',
  chapterController.deleteChapter
);

module.exports = router;