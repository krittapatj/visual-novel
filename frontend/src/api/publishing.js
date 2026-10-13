import api from './axios';

export const publishGame = async (gameId, versionName) => {
  const response = await api.post(
    `/creator/games/${gameId}/publish`,
    { versionName }
  );

  return response.data;
};

export const getGameVersions = async (gameId) => {
  const response = await api.get(
    `/creator/games/${gameId}/versions`
  );

  return response.data.versions;
};