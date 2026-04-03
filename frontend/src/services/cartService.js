import api from './api';

export const cartService = {
    getCart: async () => {
        const response = await api.get('/cart/');
        return response.data;
    },
    addToCart: async (productId, quantity = 1) => {
        const response = await api.post('/cart/add/', { product_id: productId, quantity });
        return response.data;
    },
    updateQuantity: async (itemId, quantity) => {
        const response = await api.patch(`/cart/item/${itemId}/`, { quantity });
        return response.data;
    },
    removeItem: async (itemId) => {
        await api.delete(`/cart/item/${itemId}/`);
    }
};