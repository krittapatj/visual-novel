
import api from "./axios";

const base = (gameId) => `/creator/games/${gameId}/characters`;

export async function getCharacters(gameId) {
  const response = await api.get(base(gameId));
  return response.data.characters;
}

export async function createCharacter(gameId, data) {
  const response = await api.post(base(gameId), data);
  return response.data.character;
}

export async function updateCharacter(gameId, characterId, data) {
  const response = await api.put(
    `${base(gameId)}/${characterId}`,
    data
  );
  return response.data;
}

export async function deleteCharacter(gameId, characterId) {
  const response = await api.delete(
    `${base(gameId)}/${characterId}`
  );
  return response.data;
}

export async function saveCharacterExpression(
  gameId,
  characterId,
  data
) {
  const response = await api.put(
    `${base(gameId)}/${characterId}/expressions`,
    data
  );
  return response.data;
}

export async function deleteCharacterExpression(
  gameId,
  characterId,
  expressionId
) {
  const response = await api.delete(
    `${base(gameId)}/${characterId}/expressions/${expressionId}`
  );
  return response.data;
}
