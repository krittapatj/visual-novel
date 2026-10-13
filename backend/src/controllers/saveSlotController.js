
const saveSlotModel = require("../models/saveSlotModel");

// ==============================
// HELPERS
// ==============================

const parseId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

const parseSlotNumber = (value) => {
  const slot = parseId(value);
  return slot && slot <= 3 ? slot : null;
};

const parseJson = (value) => {
  return typeof value === "string"
    ? JSON.parse(value)
    : value;
};

const getSnapshotChapter = (snapshot, chapterId) => {
  return snapshot.chapters.find(
    (chapter) =>
      Number(chapter.chapterId) === Number(chapterId)
  );
};

const formatSave = (row) => ({
  saveId: row.save_id,
  gameId: row.game_id,
  versionId: row.version_id,
  versionNumber: row.version_number,
  versionName: row.version_name,
  slotNumber: row.slot_number,
  currentNodeId: row.current_node_id,
  saveData: parseJson(row.save_data),
  savedAt: row.saved_at,
});

// Build game data from a saved published snapshot.
const buildGameData = (row) => {
  const snapshot = parseJson(row.story_snapshot);

  if (!Array.isArray(snapshot?.chapters)) {
    throw new Error("Saved version data is invalid");
  }

  const chapters = [...snapshot.chapters].sort(
    (a, b) => a.chapterOrder - b.chapterOrder
  );

  return {
    game: snapshot.game,
    version: {
      versionId: row.version_id,
      versionNumber: row.version_number,
      versionName: row.version_name,
    },
    chapters,
    assets: snapshot.assets || [],
    characters: snapshot.characters || [],
  };
};

// Validate and sanitize save data before writing.
const validateSavePayload = async (
  gameId,
  body
) => {
  const { versionId, currentNodeId, saveData } =
    body || {};

  const parsedVersionId = parseId(versionId);

  if (
    !parsedVersionId ||
    typeof currentNodeId !== "string" ||
    !currentNodeId.trim() ||
    currentNodeId.length > 36 ||
    !saveData ||
    typeof saveData !== "object" ||
    Array.isArray(saveData)
  ) {
    return {
      error: "Invalid save data",
      status: 400,
    };
  }

  const version = await saveSlotModel.getVersion(
    gameId,
    parsedVersionId
  );

  if (!version) {
    return {
      error: "Published game version not found",
      status: 404,
    };
  }

  const snapshot = parseJson(version.story_snapshot);

  if (!Array.isArray(snapshot?.chapters)) {
    return {
      error: "Invalid published snapshot",
      status: 500,
    };
  }

  const chapterId = parseId(saveData.chapterId);

  const chapter = getSnapshotChapter(
    snapshot,
    chapterId
  );

  if (!chapter) {
    return {
      error: "Chapter not found in this version",
      status: 400,
    };
  }

  const nodeExists = chapter.nodes?.some(
    (node) => String(node.id) === currentNodeId
  );

  if (!nodeExists) {
    return {
      error: "Node not found in this version",
      status: 400,
    };
  }

  const history = saveData.history ?? [];

  if (
    !Array.isArray(history) ||
    history.length > 500 ||
    history.some(
      (item) =>
        !item ||
        typeof item.nodeId !== "string" ||
        !chapter.nodes.some(
          (node) => String(node.id) === item.nodeId
        )
    )
  ) {
    return {
      error: "Invalid story history",
      status: 400,
    };
  }

  const safeSaveData = {
    schemaVersion: 1,
    chapterId,
    background:
      typeof saveData.background === "string"
        ? saveData.background.slice(0, 2048)
        : null,
    history: history.map((item) => ({
      nodeId: item.nodeId,
      background:
        typeof item.background === "string"
          ? item.background.slice(0, 2048)
          : null,
    })),
  };

  return {
    versionId: parsedVersionId,
    currentNodeId,
    saveData: safeSaveData,
  };
};

// Validate that a saved position exists in its version.
const validateLoadedSave = (row) => {
  const snapshot = parseJson(row.story_snapshot);
  const save = formatSave(row);

  if (!Array.isArray(snapshot?.chapters)) {
    return {
      error: "Saved version data is invalid",
      status: 500,
    };
  }

  const chapter = getSnapshotChapter(
    snapshot,
    save.saveData?.chapterId
  );

  if (
    !chapter ||
    !chapter.nodes?.some(
      (node) => String(node.id) === save.currentNodeId
    )
  ) {
    return {
      error: "Saved story position is invalid",
      status: 409,
    };
  }

  return {
    save,
    gameData: buildGameData(row),
  };
};

// ==============================
// MANUAL SAVE / LOAD
// ==============================

// GET /api/games/:gameId/saves
const getSaveSlots = async (req, res) => {
  try {
    const gameId = parseId(req.params.gameId);

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
    }

    const rows = await saveSlotModel.getSaveSlots(
      req.user.userId,
      gameId
    );

    return res.json({
      success: true,
      saves: rows.map(formatSave),
    });
  } catch (error) {
    console.error("Get save slots error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load save slots",
    });
  }
};

// PUT /api/games/:gameId/saves/:slotNumber
const saveGame = async (req, res) => {
  try {
    const gameId = parseId(req.params.gameId);
    const slotNumber = parseSlotNumber(
      req.params.slotNumber
    );

    if (!gameId || !slotNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID or slot number",
      });
    }

    const validated = await validateSavePayload(
      gameId,
      req.body
    );

    if (validated.error) {
      return res.status(validated.status).json({
        success: false,
        message: validated.error,
      });
    }

    await saveSlotModel.upsertSaveSlot({
      userId: req.user.userId,
      gameId,
      versionId: validated.versionId,
      slotNumber,
      currentNodeId: validated.currentNodeId,
      saveData: validated.saveData,
    });

    return res.json({
      success: true,
      message: "Game saved successfully",
      slotNumber,
    });
  } catch (error) {
    console.error("Save game error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save game",
    });
  }
};

// GET /api/games/:gameId/saves/:slotNumber
const loadGame = async (req, res) => {
  try {
    const gameId = parseId(req.params.gameId);
    const slotNumber = parseSlotNumber(
      req.params.slotNumber
    );

    if (!gameId || !slotNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID or slot number",
      });
    }

    const row = await saveSlotModel.getSaveSlot(
      req.user.userId,
      gameId,
      slotNumber
    );

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Save slot not found",
      });
    }

    const loaded = validateLoadedSave(row);

    if (loaded.error) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.error,
      });
    }

    return res.json({
      success: true,
      save: loaded.save,
      gameData: loaded.gameData,
    });
  } catch (error) {
    console.error("Load game error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load game",
    });
  }
};

// DELETE /api/games/:gameId/saves/:slotNumber
const deleteSave = async (req, res) => {
  try {
    const gameId = parseId(req.params.gameId);
    const slotNumber = parseSlotNumber(
      req.params.slotNumber
    );

    if (!gameId || !slotNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID or slot number",
      });
    }

    const deleted = await saveSlotModel.deleteSaveSlot(
      req.user.userId,
      gameId,
      slotNumber
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Save slot not found",
      });
    }

    return res.json({
      success: true,
      message: "Save deleted successfully",
    });
  } catch (error) {
    console.error("Delete save error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete save",
    });
  }
};

// ==============================
// AUTO SAVE / LOAD
// ==============================

// PUT /api/games/:gameId/autosave
const saveAutoGame = async (req, res) => {
  try {
    const gameId = parseId(req.params.gameId);

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
    }

    const validated = await validateSavePayload(
      gameId,
      req.body
    );

    if (validated.error) {
      return res.status(validated.status).json({
        success: false,
        message: validated.error,
      });
    }

    await saveSlotModel.upsertAutoSave({
      userId: req.user.userId,
      gameId,
      versionId: validated.versionId,
      currentNodeId: validated.currentNodeId,
      saveData: validated.saveData,
    });

    return res.json({
      success: true,
      message: "Game auto saved successfully",
    });
  } catch (error) {
    console.error("Auto save error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to auto save game",
    });
  }
};

// GET /api/games/:gameId/autosave
const loadAutoGame = async (req, res) => {
  try {
    const gameId = parseId(req.params.gameId);

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
    }

    const row = await saveSlotModel.getAutoSave(
      req.user.userId,
      gameId
    );

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Auto save not found",
      });
    }

    const loaded = validateLoadedSave(row);

    if (loaded.error) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.error,
      });
    }

    return res.json({
      success: true,
      save: loaded.save,
      gameData: loaded.gameData,
    });
  } catch (error) {
    console.error("Auto load error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load auto save",
    });
  }
};

// ==============================
// EXPORTS
// ==============================

module.exports = {
  getSaveSlots,
  saveGame,
  loadGame,
  deleteSave,
  saveAutoGame,
  loadAutoGame,
};
