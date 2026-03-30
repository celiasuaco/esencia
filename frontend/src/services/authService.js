import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/auth/';

export const authService = {
  // Registro de usuario
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}register/`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error en el servidor";
    }
  },

  // Inicio de sesión
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}login/`, { email, password });
      
      if (response.data.access) {
        // Guardamos los tokens y el user
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return response.data; 
      }
    } catch (error) {
      throw error.response?.data || "Credenciales incorrectas";
    }
  },

  // Cierre de sesión mejorado para evitar el estado "pending"
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh');
    const accessToken = localStorage.getItem('access');
    
    try {
      if (refreshToken && accessToken) {
        // Añadimos un timeout para que si el backend no responde en 2 seg, 
        // el frontend limpie la sesión de todos modos.
        await axios.post(`${API_URL}logout/`, 
          { refresh: refreshToken },
          { 
            headers: { 'Authorization': `Bearer ${accessToken}` },
            timeout: 2000 
          }
        );
      }
    } catch (error) {
      console.warn("El servidor no pudo invalidar el token o ya estaba expirado:", error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.replace('/login');
    }
  },

  // Actualizar perfil (maneja texto y archivos)
  updateProfile: async (formData) => {
    try {
      const token = localStorage.getItem('access');
      const response = await axios.patch(`${API_URL}profile/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      // Sincronizamos el localStorage inmediatamente tras el éxito
      if (response.data) {
        authService.updateLocalUser(response.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error al actualizar perfil";
    }
  },

  // Helper para sincronizar los datos locales
  updateLocalUser: (userData) => {
    // Mantenemos la estructura del objeto usuario
    localStorage.setItem('user', JSON.stringify(userData));
  },

  // Helpers de utilidad
  getCurrentUser: () => {
    try {
        const user = localStorage.getItem('user');
        // Añadimos un chequeo de seguridad por si el JSON está mal formado
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
  },
  getAccessToken: () => localStorage.getItem('access'),
  isAuthenticated: () => !!localStorage.getItem('access'),
};