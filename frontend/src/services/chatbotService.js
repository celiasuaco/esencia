import api from './api';

export const chatbotService = {
    // Envía una consulta al asistente de clientes sobre el catálogo o términos legales.
    ask: async (message) => {
        const response = await api.post('/chatbot/ask/', { message });
        return response.data;
    },

    // Envía una consulta al analista de inteligencia de negocio (solo Staff).
    askAdmin: async (message) => {
        const response = await api.post('/chatbot/admin/ask/', { message });
        return response.data;
    }
};