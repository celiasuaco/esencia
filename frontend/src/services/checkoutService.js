// src/services/checkoutService.js
import api from './api';

export const checkoutService = {
    // Crea una sesión de pago con la dirección proporcionada
    createPaymentSession: async (address) => {
        const response = await api.post('/cart/create-payment-session/', address);
        return response.data;
    },

    // Confirma el pago utilizando el ID de la sesión de Stripe
    confirmPayment: async (sessionId) => {
        const response = await api.post('/cart/confirm-payment/', {
            session_id: sessionId
        });
        return response.data;
    }
};