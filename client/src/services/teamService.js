import api from './api';

export const getTeams = async () => {
  const response = await api.get('/teams');
  return response.data;
};

export const createTeam = async (data) => {
  const response = await api.post('/teams', data);
  return response.data;
};

export const updateTeam = async (id, data) => {
  const response = await api.put(`/teams/${id}`, data);
  return response.data;
};

export const deleteTeam = async (id) => {
  const response = await api.delete(`/teams/${id}`);
  return response.data;
};
