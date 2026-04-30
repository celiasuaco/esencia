import api from './api';

export const dashboardService = {
  // Obtiene las estadísticas del dashboard
  getStats: async () => {
    const response = await api.get('/dashboard'); 
    return response.data;
  }
};