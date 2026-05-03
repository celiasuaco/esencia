import api from './api';

export const cartService = {
    // Obtiene el carrito actual del usuario
    getCart: async () => {
        const response = await api.get('/cart/');
        return response.data;
    },
    // Agrega un producto al carrito con una cantidad específica (por defecto 1)
    addToCart: async (productId, quantity = 1) => {
        const response = await api.post('/cart/add/', { product_id: productId, quantity });
        return response.data;
    },
    // Actualiza la cantidad de un producto específico en el carrito
    updateQuantity: async (itemId, quantity) => {
        const response = await api.patch(`/cart/item/${itemId}/`, { quantity });
        return response.data;
    },
    // Elimina un producto específico del carrito
    removeItem: async (itemId) => {
        await api.delete(`/cart/item/${itemId}/`);
    }
};