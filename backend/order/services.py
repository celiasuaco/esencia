# order/services.py
from checkout.models import Cart, CartItem
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from .models import Order, OrderItem


class OrderService:
    @staticmethod
    @transaction.atomic
    def create_from_cart(user, address):
        cart = get_object_or_404(Cart, user=user)
        active_items = cart.items.filter(status=CartItem.Status.ACTIVE)

        if not active_items.exists():
            raise ValidationError("El carrito está vacío.")

        for item in active_items:
            if item.product.stock < item.quantity:
                raise ValidationError(
                    f"Lo sentimos, el producto {item.product.name} ya no tiene stock suficiente (Disponible: {item.product.stock})."
                )

        order = Order.objects.create(user=user, address=address)

        for item in active_items:
            OrderService._create_order_item(order, item)

        order.update_totals()

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
        """
        Si el estado pasa a PAID desde aquí (ej. acción manual del admin),
        deberíamos asegurar que se ejecute la lógica de process_payment_success.
        """
        order.status = new_status
        order.save()
        return order
