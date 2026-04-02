from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import F, Sum
from product.models import Product


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        result = self.items.aggregate(total=Sum(F("product__price") * F("quantity")))[
            "total"
        ]
        return result or Decimal("0.00")

    @property
    def shipping(self):
        if self.subtotal >= 100 or self.subtotal == 0:
            return Decimal("0.00")
        return Decimal("4.99")

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
