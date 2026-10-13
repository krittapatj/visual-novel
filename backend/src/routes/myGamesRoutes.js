const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const myGamesController = require("../controllers/myGamesController");

// GET /api/my-games
// แสดงเกมที่ผู้ใช้เคยบันทึกไว้
router.get(
  "/my-games",
  authMiddleware,
  myGamesController.getMyGames
);

module.exports = router;