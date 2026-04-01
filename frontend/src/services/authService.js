import api from './api';

export const authService = {
  // Registro de usuario
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error en el servidor";
    }
  },

  // Inicio de sesión
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      
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

  // Cierre de sesión mejorado
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh');
    
    try {
      if (refreshToken) {
        // Usamos api en lugar de axios. Los headers se inyectan automáticamente en api.js
        await api.post('/auth/logout/', 
          { refresh: refreshToken },
          { timeout: 2000 } 
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
      // El interceptor de api.js ya añade el Authorization header automáticamente
      const response = await api.patch('/auth/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data) {
        authService.updateLocalUser(response.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error al actualizar perfil";
    }
  },

  // Enviar email de recuperación
  sendPasswordResetEmail: async (email) => {
    try {
      const response = await api.post('/auth/password-reset/', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error al enviar el email";
    }
  },

  // Confirmar nueva contraseña
  confirmPasswordReset: async (uidb64, token, newPassword) => {
    try {
      const response = await api.post('/auth/password-reset-confirm/', {
        uidb64,
        token,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || "El enlace ha expirado o es inválido";
    }
  },

  // --- HELPERS DE UTILIDAD ---
  
  updateLocalUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  getAccessToken: () => localStorage.getItem('access'),
  
  isAuthenticated: () => !!localStorage.getItem('access'),
};