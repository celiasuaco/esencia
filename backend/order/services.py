from checkout.models import Cart
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from .models import Order, OrderItem


class OrderService:
    @staticmethod
    @transaction.atomic
    def create_from_cart(user, address):
        cart = get_object_or_404(Cart, user=user)
        if not cart.items.exists():
            raise ValidationError("El carrito está vacío.")

        # 1. Crear la instancia del pedido
        order = Order.objects.create(user=user, address=address)

        # 2. Crear los OrderItems basados en el carrito actual
        for item in cart.items.all():
            OrderService._create_order_item(order, item)
            # Reducir stock del producto
            item.product.stock -= item.quantity
            item.product.save()

        # 3. Calcular totales finales y limpiar carrito
        order.update_totals()
        cart.items.all().delete()

        return order

    @staticmethod
    def _create_order_item(order, cart_item):
        return OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            price_at_purchase=cart_item.product.price,
            quantity=cart_item.quantity,
        )

    @staticmethod
    def update_order_status(order, new_status):
        """El modelo Order.save() ya gestiona el campo is_paid automáticamente"""
        order.status = new_status
        order.save()
        return order
