import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
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
        const refreshToken = localStorage.getItem('refreshToken');
        
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, 
          { refresh: refreshToken },
          { withCredentials: true }
        );

        const { access } = response.data;

        localStorage.setItem('accessToken', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;

        return api(originalRequest);
        
      } catch (refreshError) {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        globalThis.location.href = '/login';
        throw refreshError;
      }
    }

    throw error;
  }
);

export default api;