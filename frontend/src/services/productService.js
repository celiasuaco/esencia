import api from './api';

export const productService = {
    // Lista completa para el administrador
    getAll: async () => {
        const response = await api.get('/products/');
        return response.data;
    },

    // Detalle de un producto
    getById: async (id) => {
        const response = await api.get(`/products/${id}/`);
        return response.data;
    },

    // Crear (con FormData para soportar la imagen 'photo')
    create: async (formData) => {
        const response = await api.post('/products/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Actualizar (usamos PATCH para actualizaciones parciales)
    update: async (id, formData) => {
        const response = await api.patch(`/products/${id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Baja lógica (el backend lo marca como is_active=False)
    delete: async (id) => {
        const response = await api.delete(`/products/${id}/`);
        return response.data;
    }
};