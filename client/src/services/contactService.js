import api from './api';

export const sendContactMessage = async (contactData) => {
  const response = await api.post('/contacts', contactData);
  return response.data;
};
