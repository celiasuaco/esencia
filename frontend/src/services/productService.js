import api from './api';

export const productService = {
    getShowcase: async () => {
        try {
            const response = await api.get('');
            return response.data;
        } catch (error) {
            console.error("Error en showcase:", error);
            throw error;
        }
    }
};