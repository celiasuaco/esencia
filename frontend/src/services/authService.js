import api from './api';

// Función auxiliar para extraer el mensaje de error
const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object' && error !== null) {
    const firstKey = Object.keys(error)[0];
    const firstError = error[firstKey];
    return Array.isArray(firstError) ? firstError[0] : firstError;
  }
  
  return "Ocurrió un error inesperado";
};

export const authService = {
  // Registro de usuario
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      throw getErrorMessage(error.response?.data) || "Error en el servidor";
    }
  },

  // Inicio de sesión
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      
      if (response.data.access) {
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data; 
      }
    } catch (error) {
      throw getErrorMessage(error.response?.data) || "Credenciales incorrectas";
    }
  },

  // Cierre de sesión
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh');
    
    const clearLocal = () => {
      localStorage.removeItem('user');
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.replace('/login');
    };

    try {
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken }, { timeout: 2000 });
      }
    } catch (error) {
      console.warn("No se pudo invalidar el token en el servidor:", error);
    } finally {
      clearLocal();
    }
  },

  // Actualizar perfil
  updateProfile: async (formData) => {
    try {
      const response = await api.patch('/auth/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data) {
        authService.updateLocalUser(response.data);
      }
      return response.data;
    } catch (error) {
      throw getErrorMessage(error.response?.data) || "Error al actualizar perfil";
    }
  },

  // Enviar email de recuperación
  sendPasswordResetEmail: async (email) => {
    try {
      const response = await api.post('/auth/password-reset/', { email });
      return response.data;
    } catch (error) {
      throw getErrorMessage(error.response?.data) || "Error al enviar el email";
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
      throw getErrorMessage(error.response?.data) || "El enlace ha expirado o es inválido";
    }
  },

  // Actualizar los datos del usuario
  updateLocalUser: (newUserData) => {
    const currentUser = authService.getCurrentUser() || {};
    const updatedUser = { ...currentUser, ...newUserData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  },

  // Obtener datos del usuario
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      localStorage.removeItem('user');
      throw getErrorMessage(e.response?.data) || "Error al obtener datos del usuario";
    }
  },

  // Sincronizar perfil con el servidor para obtener datos actualizados
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile/');
      
      if (response.data) {
        authService.updateLocalUser(response.data);
      }
      return response.data;
    } catch (error) {
      throw getErrorMessage(error.response?.data) || "Error al obtener perfil";
    }
  },

  // Derecho al olvido: Anonimización y cierre de cuenta
  deleteAccount: async () => {
    try {
      const response = await api.post('/auth/delete-account/');
      
      localStorage.removeItem('user');
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      
      return response.data;
    } catch (error) {
      throw getErrorMessage(error.response?.data) || "No se pudo procesar la eliminación de la cuenta";
    }
  },

  // Obtener estadísticas de clientes para administración
  getUsersStats: async () => {
    try {
      const response = await api.get('/auth/admin/users/');
      return response.data;
    } catch (error) {
      throw getErrorMessage(error.response?.data) || "Error al obtener estadísticas de clientes";
    }
  },

  getAccessToken: () => localStorage.getItem('access'),
  
  isAuthenticated: () => !!localStorage.getItem('access'),
};