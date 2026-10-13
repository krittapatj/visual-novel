import api from "./axios";

// ==============================
// MANUAL SAVE / LOAD
// ==============================

// Get all manual save slots
export const getSaveSlots = async (gameId) => {
  const response = await api.get(
    `/games/${gameId}/saves`
  );

  return response.data.saves;
};

// Save to manual slot
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

// Load from manual slot
export const loadGameFromSlot = async (
  gameId,
  slotNumber
) => {
  const response = await api.get(
    `/games/${gameId}/saves/${slotNumber}`
  );

  return response.data;
};

// Delete manual slot
export const deleteSaveSlot = async (
  gameId,
  slotNumber
) => {
  const response = await api.delete(
    `/games/${gameId}/saves/${slotNumber}`
  );

  return response.data;
};

// ==============================
// AUTO SAVE / LOAD
// ==============================

// Automatically save game progress
export const saveAutoGame = async (
  gameId,
  payload
) => {
  const response = await api.put(
    `/games/${gameId}/autosave`,
    payload
  );

  return response.data;
};

// Load latest auto save
export const loadAutoGame = async (gameId) => {
  const response = await api.get(
    `/games/${gameId}/autosave`
  );

  return response.data;
};