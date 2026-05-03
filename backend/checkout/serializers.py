from product.serializers import ProductSerializer
from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    """
    Serializer para los elementos individuales del carrito.
    Incluye detalles del producto y el subtotal calculado.
    """

    product_details = ProductSerializer(source="product", read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_details",
            "quantity",
            "status",
            "subtotal",
        ]


class CartSerializer(serializers.ModelSerializer):
    """
    Serializer principal del Carrito.
    Filtra automáticamente para mostrar solo los productos activos.
    """

    items = serializers.SerializerMethodField()

    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    shipping = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "subtotal", "shipping", "total"]

    def get_items(self, obj):
        """
        Filtra la relación inversa para devolver únicamente los items
        que el usuario tiene actualmente en su cesta (Status.ACTIVE).
        Esto evita que los items 'CONVERTED' o 'ABANDONED' aparezcan en la UI.
        """
        active_items = obj.items.filter(status=CartItem.Status.ACTIVE)
        return CartItemSerializer(active_items, many=True).data
