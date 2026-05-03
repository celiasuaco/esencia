import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh');
        
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, 
          { refresh: refreshToken },
          { withCredentials: true }
        );

        const { access } = response.data;

        localStorage.setItem('access', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;

        return api(originalRequest);
        
      } catch (refreshError) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        globalThis.location.href = '/login';
        throw refreshError;
      }
    }

    throw error;
  }
);

export default api;