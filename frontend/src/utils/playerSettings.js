
const STORAGE_KEY = "visual-novel-player-settings";

export const DEFAULT_PLAYER_SETTINGS = {
  textSpeed: 40,
  masterVolume: 80,
  autoPlay: false,
  autoPlayDelay: 2000,
};

const clamp = (value, min, max, fallback) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
};

export const normalizePlayerSettings = (settings = {}) => ({
  textSpeed: clamp(
    settings.textSpeed,
    0,
    100,
    DEFAULT_PLAYER_SETTINGS.textSpeed
  ),
  masterVolume: clamp(
    settings.masterVolume,
    0,
    100,
    DEFAULT_PLAYER_SETTINGS.masterVolume
  ),
  autoPlay:
    typeof settings.autoPlay === "boolean"
      ? settings.autoPlay
      : DEFAULT_PLAYER_SETTINGS.autoPlay,
  autoPlayDelay: clamp(
    settings.autoPlayDelay,
    1000,
    10000,
    DEFAULT_PLAYER_SETTINGS.autoPlayDelay
  ),
});

export const loadPlayerSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return { ...DEFAULT_PLAYER_SETTINGS };
    }

    return normalizePlayerSettings(JSON.parse(stored));
  } catch (error) {
    console.error("Load player settings error:", error);
    return { ...DEFAULT_PLAYER_SETTINGS };
  }
};

export const savePlayerSettings = (settings) => {
  const normalized = normalizePlayerSettings(settings);

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalized)
    );
  } catch (error) {
    console.error("Save player settings error:", error);
  }

  return normalized;
};
