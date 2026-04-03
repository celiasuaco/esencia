// services/orderService.js
import api from './api';

export const orderService = {
    // Para Clientes: Crear pedido desde el carrito
    createOrder: async (address) => {
        const response = await api.post('/orders', { address });
        return response.data;
    },

    // Para Clientes: Ver mis pedidos
    getMyOrders: async () => {
        const response = await api.get('/orders');
        return response.data;
    },

    // Para Admin: Ver todos los pedidos con filtros (tracking o email)
    getAllOrders: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.email) params.append('email', filters.email);
        if (filters.tracking) params.append('tracking', filters.tracking);
        
        const response = await api.get(`/orders/?${params.toString()}`);
        return response.data;
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