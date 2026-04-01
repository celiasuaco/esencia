from .models import Product


class ProductService:
    @staticmethod
    def get_all_products(include_inactive=False):
        if include_inactive:
            return Product.objects.all().order_by("name")
        return Product.objects.filter(is_active=True).order_by("name")

    @staticmethod
    def create_product(validated_data):
        # validated_data ya incluye la foto si viene en el request
        return Product.objects.create(**validated_data)

    @staticmethod
    def update_product(product_instance, validated_data):
        for attr, value in validated_data.items():
            setattr(product_instance, attr, value)
        product_instance.save()
        return product_instance

    @staticmethod
    def soft_delete(product_instance):
        product_instance.is_active = False
        product_instance.save()
        return product_instance
