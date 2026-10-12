import api from './axios';

// Public APIs
export const getPublishedGames = async () => {
  const response = await api.get('/games');
  return response.data.games;
};

export const getPublishedGame = async (gameId) => {
  const response = await api.get(`/games/${gameId}`);
  return response.data.game;
};

// Creator APIs
export const getMyGames = async () => {
  const response = await api.get('/creator/games');
  return response.data.games;
};

export const getMyGame = async (gameId) => {
  const response = await api.get(
    `/creator/games/${gameId}`
  );
  return response.data.game;
};

export const createGame = async (data) => {
  const response = await api.post(
    '/creator/games',
    data
  );
  return response.data.game;
};

export const updateGame = async (gameId, data) => {
  const response = await api.put(
    `/creator/games/${gameId}`,
    data
  );
  return response.data.game;
};

export const deleteGame = async (gameId) => {
  const response = await api.delete(
    `/creator/games/${gameId}`
  );
  return response.data;
};