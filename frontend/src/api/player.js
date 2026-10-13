import api from "./axios";

export const getPublishedGameForPlay = async (gameId) => {
  const response = await api.get(`/games/${gameId}/play`);
  return response.data;
};