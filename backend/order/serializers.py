from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializador para los items de un pedido, incluye información del producto al momento de la compra."""

    product_name = serializers.ReadOnlyField(source="product.name")
    product_photo = serializers.ImageField(source="product.photo", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_photo",
            "price_at_purchase",
            "quantity",
            "subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):
    """Serializador para los pedidos, incluye información sobre los items y el usuario."""

    order_items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.ReadOnlyField(source="user.email")
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user_email",
            "tracking_code",
            "address",
            "placed_at",
            "status",
            "is_paid",
            "status_display",
            "address",
            "latitude",
            "longitude",
            "subtotal_amount",
            "shipping_amount",
            "total_amount",
            "order_items",
        ]
        read_only_fields = [
            "tracking_code",
            "placed_at",
            "is_paid",
            "subtotal_amount",
            "shipping_amount",
            "total_amount",
        ]
        extra_kwargs = {
            "latitude": {"required": False, "allow_null": True},
            "longitude": {"required": False, "allow_null": True},
        }
