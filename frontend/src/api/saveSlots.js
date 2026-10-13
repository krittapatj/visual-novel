
import api from "./axios";

export const getSaveSlots = async (gameId) => {
  const response = await api.get(
    `/games/${gameId}/saves`
  );

  return response.data.saves;
};

export const saveGameToSlot = async (
  gameId,
  slotNumber,
  payload
) => {
  const response = await api.put(
    `/games/${gameId}/saves/${slotNumber}`,
    payload
  );

  return response.data;
};

export const loadGameFromSlot = async (
  gameId,
  slotNumber
) => {
  const response = await api.get(
    `/games/${gameId}/saves/${slotNumber}`
  );

  return response.data;
};

export const deleteSaveSlot = async (
  gameId,
  slotNumber
) => {
  const response = await api.delete(
    `/games/${gameId}/saves/${slotNumber}`
  );

  return response.data;
};
