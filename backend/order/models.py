import secrets
import string
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone
from product.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pendiente"
        PAID = "PAID", "Pagado"
        SHIPPED = "SHIPPED", "Enviado"
        DELIVERED = "DELIVERED", "Entregado"
        CANCELLED = "CANCELLED", "Cancelado"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders"
    )
    address = models.CharField(max_length=255)
    placed_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    tracking_code = models.CharField(max_length=8, unique=True, editable=False)
    is_paid = models.BooleanField(default=False)

    @property
    def shipping(self):
        return Decimal(4.99 if self.subtotal < 100 else 0)

    @property
    def subtotal(self):
        # Sumamos el subtotal de cada OrderItem vinculado
        return sum(item.subtotal for item in self.order_items.all())

    @property
    def total(self):
        return self.subtotal + self.shipping

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            self.tracking_code = self._generate_unique_code()

        # Lógica automática: si pasa a PAID o envío, marcamos como pagado
        if self.status in [
            self.Status.PAID,
            self.Status.SHIPPED,
            self.Status.DELIVERED,
        ]:
            self.is_paid = True

        super().save(*args, **kwargs)

    def _generate_unique_code(self):
        chars = string.ascii_uppercase + string.digits
        while True:
            code = "".join(secrets.choice(chars) for _ in range(8))
            if not Order.objects.filter(tracking_code=code).exists():
                return code


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="order_items"
    )
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    # IMPORTANTE: Guardamos el precio del momento de la compra
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.price_at_purchase * self.quantity

    def __str__(self):
        return (
            f"{self.quantity} x {self.product.name} (Pedido {self.order.tracking_code})"
        )
