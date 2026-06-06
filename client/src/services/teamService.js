import api from './api';

export const getTeams = async () => {
  const response = await api.get('/teams');
  return response.data;
};
