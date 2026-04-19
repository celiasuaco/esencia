import secrets
import string
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone
from product.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
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
        max_length=20, choices=Status.choices, default=Status.PAID
    )
    tracking_code = models.CharField(max_length=8, unique=True, editable=False)
    is_paid = models.BooleanField(default=True)

    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def update_totals(self):
        """
        Calcula y guarda los totales físicos en la DB basados en los items actuales.
        Se debe llamar después de crear los OrderItems.
        """
        # Calculamos el subtotal sumando los items asociados
        subtotal = sum(
            item.price_at_purchase * item.quantity for item in self.order_items.all()
        )

        # Aplicamos lógica de envío (Gratis > 100€)
        shipping = (
            Decimal("4.99") if subtotal < 100 and subtotal > 0 else Decimal("0.00")
        )

        # Actualizamos campos físicos
        self.subtotal_amount = subtotal
        self.shipping_amount = shipping
        self.total_amount = subtotal + shipping

        # Guardamos solo estos campos para evitar re-ejecutar toda la lógica del save()
        Order.objects.filter(pk=self.pk).update(
            subtotal_amount=self.subtotal_amount,
            shipping_amount=self.shipping_amount,
            total_amount=self.total_amount,
        )

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            self.tracking_code = self._generate_unique_code()

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

    def __str__(self):
        return f"Pedido {self.tracking_code} - {self.user.email}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="order_items"
    )
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        """Este sigue siendo property ya que el Order.update_totals() ya fija el valor final"""
        return self.price_at_purchase * self.quantity

    def __str__(self):
        return (
            f"{self.quantity} x {self.product.name if self.product else 'Producto eliminado'} "
            f"(Pedido {self.order.tracking_code})"
        )
