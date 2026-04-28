from .models import Product


class ProductService:
    @staticmethod
    def get_all_products(include_inactive=False, filters=None, sort_by=None):
        if include_inactive:
            queryset = Product.objects.all()
        else:
            queryset = Product.objects.filter(is_active=True)

        if filters:
            if filters.get("material"):
                queryset = queryset.filter(material__iexact=filters["material"])
            if filters.get("min_price"):
                queryset = queryset.filter(price__gte=filters["min_price"])
            if filters.get("max_price"):
                queryset = queryset.filter(price__lte=filters["max_price"])
            if filters.get("category"):
                queryset = queryset.filter(category__iexact=filters["category"])

        if sort_by:
            if sort_by == "price_asc":
                queryset = queryset.order_by("price")
            elif sort_by == "price_desc":
                queryset = queryset.order_by("-price")
            else:
                queryset = queryset.order_by("name")
        else:
            queryset = queryset.order_by("name")

        return queryset

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
