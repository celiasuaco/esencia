// services/orderService.js
import api from './api';

export const orderService = {
    createOrder: async (address) => {
        const response = await api.post('/orders/', { address }); 
        return response.data;
    },
    
    getMyOrders: async () => {
        const response = await api.get('/orders/'); 
        return response.data;
    },

    // Para Admin: Ver todos los pedidos con filtros (tracking o email)
    getAllOrders: async (filters = {}) => {
        try {
            const response = await api.get('/orders/', { 
                params: filters 
            });
            return response.data;
        } catch (error) {
            console.error("Error en orderService.getAllOrders:", error);
            throw error;
        }
    },

    // Para Admin: Cambiar estado (Trigger automático de is_paid en backend)
    updateStatus: async (orderId, newStatus) => {
        const response = await api.patch(`/orders/${orderId}/change_status/`, { status: newStatus });
        return response.data;
    },

    // Ver detalle de un pedido específico
    getOrderDetails: async (orderId) => {
        const response = await api.get(`/orders/${orderId}/`);
        return response.data;
    }
};