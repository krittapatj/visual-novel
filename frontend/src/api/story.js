import api from './axios';

export const getStoryGraph = async (chapterId) => {
  const response = await api.get(
    `/creator/chapters/${chapterId}/graph`
  );

  return response.data;
};

export const saveStoryGraph = async (
  chapterId,
  nodes,
  edges
) => {
  const response = await api.put(
    `/creator/chapters/${chapterId}/graph`,
    { nodes, edges }
  );

  return response.data;
};