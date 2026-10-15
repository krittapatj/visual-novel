
const myGamesModel = require("../models/myGamesModel");

// Read artwork from the published version only.
// Never fall back to games.cover_url or games.thumbnail_url.
const getPublishedArtwork = (snapshotValue) => {
  try {
    const snapshot =
      typeof snapshotValue === "string"
        ? JSON.parse(snapshotValue)
        : snapshotValue;

    const artwork = snapshot?.game;

    return {
      coverUrl: artwork?.coverUrl ?? null,
      thumbnailUrl: artwork?.thumbnailUrl ?? null,
    };
  } catch (error) {
    console.error("Invalid published artwork snapshot:", error);

    return {
      coverUrl: null,
      thumbnailUrl: null,
    };
  }
};

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

    const formattedGames = games.map((game) => {
      const artwork = getPublishedArtwork(game.published_snapshot);

      return {
        gameId: game.game_id,
        title: game.title,
        description: game.description,

        // Use the published thumbnail for landscape cards.
        // Fall back only to the published cover.
        coverUrl: artwork.thumbnailUrl ?? artwork.coverUrl,
        thumbnailUrl: artwork.thumbnailUrl,

        creatorUsername: game.creator_username,
        publishedVersionId: game.published_version_id,
        lastPlayedAt: game.last_played_at,
        hasAutoSave: Boolean(Number(game.has_auto_save)),
        manualSlotCount: Number(game.manual_slot_count),
      };
    });

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
