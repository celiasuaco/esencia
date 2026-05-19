from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Product
from .permissions import IsAdminOrReadOnly
from .serializers import ProductSerializer
from .services import ProductService


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_authenticated and (
            user.is_staff or getattr(user, "role", None) == "ADMIN"
        )

        filters = {
            "material": self.request.query_params.get("material"),
            "min_price": self.request.query_params.get("min_price"),
            "max_price": self.request.query_params.get("max_price"),
            "category": self.request.query_params.get("category"),
        }
        sort_by = self.request.query_params.get("sort")

        return ProductService.get_all_products(
            include_inactive=is_admin, filters=filters, sort_by=sort_by
        )

    def perform_create(self, serializer):
        ProductService.create_product(serializer.validated_data)

    def perform_update(self, serializer):
        ProductService.update_product(self.get_object(), serializer.validated_data)

    def destroy(self, request, *args, **kwargs):
        ProductService.soft_delete(self.get_object())
        return Response(
            {"message": "Producto desactivado correctamente"}, status=status.HTTP_200_OK
        )
