import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
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
        
        const response = await axios.post('http://localhost:8000/api/token/refresh/', 
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