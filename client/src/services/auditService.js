import api from './api';

export const getAuditLogs = async (teamId, page = 1, limit = 20) => {
  const params = { page, limit };
  if (teamId) {
    params.teamId = teamId;
  }
  const response = await api.get('/audit', { params });
  return response.data;
};
