
const Character = require("../models/characterModel");

const validId = (value) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0;

const sendError = (res, error) => {
  console.error("Character API error:", error);
  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};

async function authorize(req, res) {
  const { gameId } = req.params;

  if (!validId(gameId)) {
    res.status(400).json({
      success: false,
      message: "Invalid game ID"
    });
    return false;
  }

  const game = await Character.getOwnedGame(
    Number(gameId),
    req.user.userId
  );

  if (!game) {
    res.status(404).json({
      success: false,
      message: "Game not found"
    });
    return false;
  }

  return true;
}

async function findCharacter(req, res) {
  if (!validId(req.params.characterId)) {
    res.status(400).json({
      success: false,
      message: "Invalid character ID"
    });
    return null;
  }

  const character = await Character.getCharacter(
    Number(req.params.gameId),
    Number(req.params.characterId)
  );

  if (!character) {
    res.status(404).json({
      success: false,
      message: "Character not found"
    });
    return null;
  }

  return character;
}

exports.listCharacters = async (req, res) => {
  try {
    if (!(await authorize(req, res))) return;

    const characters = await Character.getCharacters(
      Number(req.params.gameId)
    );

    const result = await Promise.all(
      characters.map(async (character) => ({
        ...character,
        expressions: await Character.getExpressions(
          character.character_id
        )
      }))
    );

    res.json({ success: true, characters: result });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createCharacter = async (req, res) => {
  try {
    if (!(await authorize(req, res))) return;

    const { character_name, description = "" } = req.body;
    const name = character_name?.trim();

    if (!name || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Character name must be 1-100 characters"
      });
    }

    const characterId = await Character.createCharacter(
      Number(req.params.gameId),
      name,
      description
    );

    res.status(201).json({
      success: true,
      character: {
        character_id: characterId,
        game_id: Number(req.params.gameId),
        character_name: name,
        description,
        expressions: []
      }
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateCharacter = async (req, res) => {
  try {
    if (!(await authorize(req, res))) return;
    if (!(await findCharacter(req, res))) return;

    const { character_name, description = "" } = req.body;
    const name = character_name?.trim();

    if (!name || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Character name must be 1-100 characters"
      });
    }

    await Character.updateCharacter(
      Number(req.params.gameId),
      Number(req.params.characterId),
      name,
      description
    );

    res.json({
      success: true,
      message: "Character updated successfully"
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteCharacter = async (req, res) => {
  try {
    if (!(await authorize(req, res))) return;
    if (!(await findCharacter(req, res))) return;

    await Character.deleteCharacter(
      Number(req.params.gameId),
      Number(req.params.characterId)
    );

    res.json({
      success: true,
      message: "Character deleted successfully"
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.saveExpression = async (req, res) => {
  try {
    if (!(await authorize(req, res))) return;
    if (!(await findCharacter(req, res))) return;

    const { asset_id, expression_name, is_default = false } = req.body;

    const name = expression_name?.trim();

    if (!validId(asset_id) || !name || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Valid asset and expression name are required"
      });
    }

    const asset = await Character.getCharacterAsset(
      Number(req.params.gameId),
      Number(asset_id)
    );

    if (!asset) {
      return res.status(400).json({
        success: false,
        message: "Select a character image from this game"
      });
    }

    await Character.saveExpression(
      Number(req.params.characterId),
      Number(asset_id),
      name,
      is_default === true
    );

    res.json({
      success: true,
      message: "Expression saved successfully"
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteExpression = async (req, res) => {
  try {
    if (!(await authorize(req, res))) return;
    if (!(await findCharacter(req, res))) return;

    if (!validId(req.params.expressionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expression ID"
      });
    }

    const deleted = await Character.deleteExpression(
      Number(req.params.characterId),
      Number(req.params.expressionId)
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Expression not found"
      });
    }

    res.json({
      success: true,
      message: "Expression deleted successfully"
    });
  } catch (error) {
    sendError(res, error);
  }
};
