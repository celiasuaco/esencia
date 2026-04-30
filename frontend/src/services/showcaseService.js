import api from './api';

export const showcaseService = {
    // Función para obtener los datos del escaparate
    getShowcase: async () => {
        try {
            const response = await api.get('');
            return response.data;
        } catch (error) {
            console.error("Error en escaparate:", error);
            throw error;
        }
    }
};