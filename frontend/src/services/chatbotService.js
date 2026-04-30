import api from './api';

export const chatbotService = {
    // Envía una pregunta al chatbot y devuelve la respuesta
    ask: async (message) => {
        const response = await api.post('/chatbot/ask/', { message });
        return response.data;
    },
    askAdmin: async (message) => {
        const response = await api.post('/chatbot/admin/ask/', { message });
        return response.data;
    }
};