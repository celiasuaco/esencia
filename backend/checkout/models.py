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
        # FILTRO CRÍTICO: Solo sumamos items con status ACTIVE
        result = self.items.filter(status=CartItem.Status.ACTIVE).aggregate(
            total=Sum(F("product__price") * F("quantity"))
        )["total"]
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
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Activo"
        CONVERTED = "CONVERTED", "Convertido a Venta"
        ABANDONED = "ABANDONED", "Abandonado/Eliminado"

    cart = models.ForeignKey(
        Cart,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="items",
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.ACTIVE
    )
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def subtotal(self):
        return self.product.price * self.quantity
