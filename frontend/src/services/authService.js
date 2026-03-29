import axios from 'axios';

// Añadimos la barra al final para evitar problemas de rutas en Django
const API_URL = 'http://localhost:8000/api/auth/';

export const authService = {
  // Registro de usuario
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}register/`, userData);
      return response.data;
    } catch (error) {
      // Extraemos el mensaje de error del backend
      throw error.response?.data || "Error en el servidor";
    }
  },

  // Inicio de sesión
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}login/`, { email, password });
      if (response.data.access) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || "Credenciales incorrectas";
    }
  },

  // Cierre de sesión
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh');
    try {
      if (refreshToken) {
        await axios.post(`${API_URL}logout/`, { refresh: refreshToken });
      }
    } catch (error) {
      console.error("Error invalidando token en el servidor", error);
    } finally {
      localStorage.clear();
      window.location.href = '/login';
    }
  },

  // Helpers de utilidad
  getCurrentUser: () => JSON.parse(localStorage.getItem('user')),
  getAccessToken: () => localStorage.getItem('access'),
  isAuthenticated: () => !!localStorage.getItem('access'),
};