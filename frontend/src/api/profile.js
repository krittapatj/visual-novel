
import api from './axios';

export const updateMyProfile = async (displayName) => {
  const response = await api.patch('/auth/me', {
    display_name: displayName
  });

  return response.data;
};
