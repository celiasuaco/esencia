from checkout.models import Cart, CartItem
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from .models import Order, OrderItem


class OrderService:
    """Servicio para manejar la lógica de creación y actualización de órdenes."""

    @staticmethod
    @transaction.atomic
    def create_from_cart(user, address, latitude=None, longitude=None):
        """Crea un pedido a partir del contenido del carrito del usuario."""
        cart = get_object_or_404(Cart, user=user)
        active_items = cart.items.filter(status=CartItem.Status.ACTIVE)

        if not active_items.exists():
            raise ValidationError("El carrito está vacío.")

        for item in active_items:
            if item.product.stock < item.quantity:
                raise ValidationError(
                    f"Lo sentimos, el producto {item.product.name} ya no tiene stock suficiente (Disponible: {item.product.stock})."
                )

        order = Order.objects.create(
            user=user, address=address, latitude=latitude, longitude=longitude
        )

        for item in active_items:
            OrderService._create_order_item(order, item)

        order.update_totals()

        return order

    @staticmethod
    def _create_order_item(order, cart_item):
        """Crea un OrderItem a partir de un CartItem."""
        return OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            price_at_purchase=cart_item.product.price,
            quantity=cart_item.quantity,
        )

    @staticmethod
    def update_order_status(order, new_status):
        """Actualiza el estado de un pedido."""
        order.status = new_status
        order.save()
        return order
