from decimal import Decimal

from django.conf import settings
from django.db import models
from product.models import Product


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def shipping(self):
        return Decimal(4.99 if self.subtotal < 100 else 0)

    @property
    def total(self):
        return self.subtotal + self.shipping


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.product.price * self.quantity
