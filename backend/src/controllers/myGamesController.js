const myGamesModel = require("../models/myGamesModel");

const getMyGames = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const games = await myGamesModel.getMyPlayedGames(userId);

    const formattedGames = games.map((game) => ({
      gameId: game.game_id,
      title: game.title,
      description: game.description,
      coverUrl: game.cover_url,
      creatorUsername: game.creator_username,
      publishedVersionId: game.published_version_id,
      lastPlayedAt: game.last_played_at,
      hasAutoSave: Boolean(Number(game.has_auto_save)),
      manualSlotCount: Number(game.manual_slot_count),
    }));

    return res.status(200).json({
      success: true,
      total: formattedGames.length,
      games: formattedGames,
    });
  } catch (error) {
    console.error("Get My Games Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load My Games",
    });
  }
};

module.exports = {
  getMyGames,
};