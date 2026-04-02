from django.shortcuts import get_object_or_404
from product.models import Product
from rest_framework.exceptions import ValidationError

from .models import Cart, CartItem


class CartService:
    @staticmethod
    def get_or_create_cart(user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    @staticmethod
    def add_item_to_cart(user, product_id, quantity):
        product = get_object_or_404(Product, id=product_id)
        cart = CartService.get_or_create_cart(user)

        # Validación de Stock
        if product.stock < quantity:
            raise ValidationError(
                f"Stock insuficiente para {product.name}. Disponible: {product.stock}"
            )

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
            new_quantity = item.quantity + quantity
            if product.stock < new_quantity:
                raise ValidationError(
                    "No puedes añadir más unidades, stock límite alcanzado."
                )
            item.quantity = new_quantity
        else:
            item.quantity = quantity

        item.save()
        return item

    @staticmethod
    def update_item_quantity(user, item_id, quantity):
        item = get_object_or_404(CartItem, id=item_id, cart__user=user)

        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            raise ValidationError("La cantidad debe ser un número válido.")

        if quantity <= 0:
            item.delete()
            return None

        if item.product.stock < quantity:
            raise ValidationError("Stock insuficiente.")

        item.quantity = quantity
        item.save()
        return item

    @staticmethod
    def remove_item(user, item_id):
        item = get_object_or_404(CartItem, id=item_id, cart__user=user)
        item.delete()
