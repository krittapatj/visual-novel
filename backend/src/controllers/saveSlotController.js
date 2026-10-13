
const saveSlotModel = require("../models/saveSlotModel");

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

    const { versionId, currentNodeId, saveData } =
      req.body || {};

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
      return res.status(400).json({
        success: false,
        message: "Invalid save data",
      });
    }

    const version = await saveSlotModel.getVersion(
      gameId,
      parsedVersionId
    );

    if (!version) {
      return res.status(404).json({
        success: false,
        message: "Published game version not found",
      });
    }

    const snapshot = parseJson(version.story_snapshot);

    if (!Array.isArray(snapshot?.chapters)) {
      return res.status(500).json({
        success: false,
        message: "Invalid published snapshot",
      });
    }

    const chapterId = parseId(saveData.chapterId);

    const chapter = getSnapshotChapter(
      snapshot,
      chapterId
    );

    if (!chapter) {
      return res.status(400).json({
        success: false,
        message: "Chapter not found in this version",
      });
    }

    const nodeExists = chapter.nodes?.some(
      (node) => String(node.id) === currentNodeId
    );

    if (!nodeExists) {
      return res.status(400).json({
        success: false,
        message: "Node not found in this version",
      });
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
      return res.status(400).json({
        success: false,
        message: "Invalid story history",
      });
    }

    // Save only supported fields.
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

    await saveSlotModel.upsertSaveSlot({
      userId: req.user.userId,
      gameId,
      versionId: parsedVersionId,
      slotNumber,
      currentNodeId,
      saveData: safeSaveData,
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

    const snapshot = parseJson(row.story_snapshot);
    const save = formatSave(row);

    if (!Array.isArray(snapshot?.chapters)) {
      return res.status(500).json({
        success: false,
        message: "Saved version data is invalid",
      });
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
      return res.status(409).json({
        success: false,
        message: "Saved story position is invalid",
      });
    }

    const chapters = [...snapshot.chapters].sort(
      (a, b) => a.chapterOrder - b.chapterOrder
    );

    return res.json({
      success: true,
      save,
      gameData: {
        game: snapshot.game,
        version: {
          versionId: row.version_id,
          versionNumber: row.version_number,
          versionName: row.version_name,
        },
        chapters,
        assets: snapshot.assets || [],
        characters: snapshot.characters || [],
      },
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

module.exports = {
  getSaveSlots,
  saveGame,
  loadGame,
  deleteSave,
};
