const chapterModel = require('../models/chapterModel');

const validId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validateChapter = (body) => {
  if (!body || typeof body.title !== 'string') {
    return null;
  }

  const title = body.title.trim();
  const order = body.chapter_order;

  if (
    !title ||
    title.length > 255 ||
    !Number.isSafeInteger(order) ||
    order < 1
  ) {
    return null;
  }

  return { title, order };
};

const handleError = (res, error) => {
  console.error('Chapter error:', error);

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Chapter order already exists'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

const createChapter = async (req, res) => {
  try {
    const gameId = validId(req.params.gameId);
    const data = validateChapter(req.body);

    if (!gameId || !data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter data'
      });
    }

    const game = await chapterModel.getOwnedGame(
      gameId,
      req.user.userId
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const chapterId = await chapterModel.createChapter(
      gameId,
      data.title,
      data.order
    );

    return res.status(201).json({
      success: true,
      message: 'Chapter created',
      chapter_id: chapterId
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getChapters = async (req, res) => {
  try {
    const gameId = validId(req.params.gameId);

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    const game = await chapterModel.getOwnedGame(
      gameId,
      req.user.userId
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const chapters = await chapterModel.getChapters(gameId);

    return res.json({
      success: true,
      chapters
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateChapter = async (req, res) => {
  try {
    const chapterId = validId(req.params.chapterId);
    const data = validateChapter(req.body);

    if (!chapterId || !data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter data'
      });
    }

    const chapter = await chapterModel.getOwnedChapter(
      chapterId,
      req.user.userId
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    await chapterModel.updateChapter(
      chapterId,
      data.title,
      data.order
    );

    return res.json({
      success: true,
      message: 'Chapter updated'
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteChapter = async (req, res) => {
  try {
    const chapterId = validId(req.params.chapterId);

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter ID'
      });
    }

    const chapter = await chapterModel.getOwnedChapter(
      chapterId,
      req.user.userId
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    await chapterModel.deleteChapter(chapterId);

    return res.json({
      success: true,
      message: 'Chapter deleted'
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createChapter,
  getChapters,
  updateChapter,
  deleteChapter
};