from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    # Mostramos el texto legible de la categoría en lugar del código interno
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "category",
            "category_display",
            "price",
            "stock",
            "photo",
            "is_active",
            "material",
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio de la joya debe ser positivo.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser menor a cero.")
        return value
