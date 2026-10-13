const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const saveSlotController = require("../controllers/saveSlotController");

router.get(
  "/games/:gameId/saves",
  authMiddleware,
  saveSlotController.getSaveSlots
);

router.put(
  "/games/:gameId/saves/:slotNumber",
  authMiddleware,
  saveSlotController.saveGame
);

router.get(
  "/games/:gameId/saves/:slotNumber",
  authMiddleware,
  saveSlotController.loadGame
);

router.delete(
  "/games/:gameId/saves/:slotNumber",
  authMiddleware,
  saveSlotController.deleteSave
);

module.exports = router;