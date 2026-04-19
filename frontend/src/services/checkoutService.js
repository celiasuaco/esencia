// src/services/checkoutService.js
import api from './api';

export const checkoutService = {
    createPaymentSession: async (address) => {
        const response = await api.post('/cart/create-payment-session/', {
            address: address
        });
        return response.data;
    },

    confirmPayment: async (sessionId) => {
        const response = await api.post('/cart/confirm-payment/', {
            session_id: sessionId
        });
        return response.data;
    }
};