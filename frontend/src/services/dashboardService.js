import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard'); 
    return response.data;
  }
};