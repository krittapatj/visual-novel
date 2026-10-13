import api from './axios';

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data.categories;
};

export const getGameCategories = async (gameId) => {
  const response = await api.get(
    `/games/${gameId}/categories`
  );

  return response.data.categories;
};

export const updateGameCategories = async (
  gameId,
  categoryIds
) => {
  const response = await api.put(
    `/creator/games/${gameId}/categories`,
    { categoryIds }
  );

  return response.data;
};

export const getMyGameCategories = async (gameId) => {
  const response = await api.get(
    `/creator/games/${gameId}/categories`
  );

  return response.data.categories;
};