import api from "./axios";

export const getMyGames = async () => {
  const response = await api.get("/my-games");
  return response.data;
};