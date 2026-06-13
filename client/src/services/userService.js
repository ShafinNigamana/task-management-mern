import api from './api';

export const searchUsers = async (searchQuery) => {
  const response = await api.get('/users', {
    params: { search: searchQuery },
  });
  return response.data;
};
