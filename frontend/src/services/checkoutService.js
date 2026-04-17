// src/services/checkoutService.js
import api from './api';

export const checkoutService = {
    createPaymentSession: async (orderId) => {
        const response = await api.post('/cart/create-payment-session/', {
            order_id: orderId
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