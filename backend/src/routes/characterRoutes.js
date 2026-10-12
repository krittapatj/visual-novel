
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/characterController");

router.use(authMiddleware);

router.get(
  "/games/:gameId/characters",
  controller.listCharacters
);

router.post(
  "/games/:gameId/characters",
  controller.createCharacter
);

router.put(
  "/games/:gameId/characters/:characterId",
  controller.updateCharacter
);

router.delete(
  "/games/:gameId/characters/:characterId",
  controller.deleteCharacter
);

router.put(
  "/games/:gameId/characters/:characterId/expressions",
  controller.saveExpression
);

router.delete(
  "/games/:gameId/characters/:characterId/expressions/:expressionId",
  controller.deleteExpression
);

module.exports = router;
