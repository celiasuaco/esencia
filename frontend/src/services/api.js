import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// 1. Interceptor de SOLICITUD: Añadir el token a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// 2. Interceptor de RESPUESTA: Manejar el refresco cuando recibimos un 401
api.interceptors.response.use(
  (response) => response, // Si la respuesta es OK, la dejamos pasar
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (No autorizado) y NO hemos reintentado ya esta petición
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marcamos para no entrar en un bucle infinito

      try {
        const refreshToken = localStorage.getItem('refresh');
        
        // Intentamos obtener un nuevo access token usando el refresh
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
          refresh: refreshToken,
        });

        const { access } = response.data;

        // Guardamos el nuevo access token
        localStorage.setItem('access', access);

        // Actualizamos el header de la petición que falló originalmente
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Reintentamos la petición original con el nuevo token
        return api(originalRequest);
        
      } catch (refreshError) {
        // Si el refresco también falla, cerramos sesión
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login'; // O redirige a tu ruta de login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;