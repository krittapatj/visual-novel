import api from './axios';

export const getChapters = async (gameId) => {
  const response = await api.get(
    `/creator/games/${gameId}/chapters`
  );

  return response.data.chapters;
};

export const createChapter = async (gameId, data) => {
  const response = await api.post(
    `/creator/games/${gameId}/chapters`,
    data
  );

  return response.data;
};

export const updateChapter = async (chapterId, data) => {
  const response = await api.put(
    `/creator/chapters/${chapterId}`,
    data
  );

  return response.data;
};

export const deleteChapter = async (chapterId) => {
  const response = await api.delete(
    `/creator/chapters/${chapterId}`
  );

  return response.data;
};