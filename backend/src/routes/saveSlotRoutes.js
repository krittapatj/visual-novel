const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const saveSlotController = require("../controllers/saveSlotController");

// ==============================
// MANUAL SAVE / LOAD
// ==============================

// Get manual save slots
router.get(
  "/games/:gameId/saves",
  authMiddleware,
  saveSlotController.getSaveSlots
);

// Save to manual slot
router.put(
  "/games/:gameId/saves/:slotNumber",
  authMiddleware,
  saveSlotController.saveGame
);

// Load manual slot
router.get(
  "/games/:gameId/saves/:slotNumber",
  authMiddleware,
  saveSlotController.loadGame
);

// Delete manual slot
router.delete(
  "/games/:gameId/saves/:slotNumber",
  authMiddleware,
  saveSlotController.deleteSave
);

// ==============================
// AUTO SAVE / LOAD
// ==============================

// Create or update auto save
router.put(
  "/games/:gameId/autosave",
  authMiddleware,
  saveSlotController.saveAutoGame
);

// Load latest auto save
router.get(
  "/games/:gameId/autosave",
  authMiddleware,
  saveSlotController.loadAutoGame
);

module.exports = router;