import api from './api';

// Función auxiliar para extraer el mensaje (puedes moverla a un utils.js)
const getErrorMessage = (error) => {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null) {
        const firstKey = Object.keys(data)[0];
        const firstError = data[firstKey];
        return Array.isArray(firstError) ? `${firstKey}: ${firstError[0]}` : firstError;
    }
    return "Error en la operación de productos";
};

export const productService = {
    getAll: async () => {
        try {
            const response = await api.get('/products/');
            return response.data;
        } catch (error) { throw getErrorMessage(error); }
    },

    getById: async (id) => {
        try {
            const response = await api.get(`/products/${id}/`);
            return response.data;
        } catch (error) { throw getErrorMessage(error); }
    },

    create: async (formData) => {
        try {
            const response = await api.post('/products/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) { throw getErrorMessage(error); }
    },

    update: async (id, formData) => {
        try {
            const response = await api.patch(`/products/${id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) { throw getErrorMessage(error); }
    },

    delete: async (id) => {
        try {
            const response = await api.delete(`/products/${id}/`);
            return response.data;
        } catch (error) { throw getErrorMessage(error); }
    }
};