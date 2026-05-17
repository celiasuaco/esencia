import api from './api';

export const chatbotService = {
    // Envía una consulta al asistente de clientes sobre el catálogo o términos legales.
    ask: async (message) => {
        const response = await api.post('/chatbot/ask/', { message });
        return response.data;
    },
};