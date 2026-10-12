import api from './axios';

export const getAssets = async (gameId) => {
  const response = await api.get(
    `/creator/games/${gameId}/assets`
  );

  return response.data.assets;
};

export const uploadAsset = async (gameId, data) => {
  const formData = new FormData();

  formData.append('image', data.image);
  formData.append('asset_name', data.asset_name);
  formData.append('asset_type', data.asset_type);

  const response = await api.post(
    `/creator/games/${gameId}/assets`,
    formData
  );

  return response.data.asset;
};

export const deleteAsset = async (gameId, assetId) => {
  const response = await api.delete(
    `/creator/games/${gameId}/assets/${assetId}`
  );

  return response.data;
};