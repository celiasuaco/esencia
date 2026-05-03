from django.db import models


class Product(models.Model):
    """Modelo para representar un producto en la tienda de joyas."""

    class Category(models.TextChoices):
        ANILLO = "ANILLO", "Anillo"
        COLLAR = "COLLAR", "Collar"
        PENDIENTE = "PENDIENTE", "Pendiente"
        PULSERA = "PULSERA", "Pulsera"

    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    photo = models.ImageField(
        upload_to="products/",
        null=True,
        blank=True,
        default="products/default_product.png",
    )
    is_active = models.BooleanField(default=True)
    material = models.CharField(max_length=50, default="Oro 18k")

    def __str__(self):
        return self.name
