from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Order
from .permissions import IsAdminOrOrderOwner
from .serializers import OrderSerializer
from .services import OrderService


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOrderOwner]

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.all().order_by("-placed_at")

        if not user.is_staff:
            return queryset.filter(user=user)

        # Capturamos filtros
        email = self.request.query_params.get("email")
        tracking = self.request.query_params.get("tracking")
        status_filter = self.request.query_params.get("status")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        price_min = self.request.query_params.get("price_min")
        price_max = self.request.query_params.get("price_max")

        if email:
            queryset = queryset.filter(user__email__icontains=email)
        if tracking:
            queryset = queryset.filter(tracking_code__iexact=tracking)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filtros de fecha (Aseguramos que no sea string vacío '')
        if date_from and date_from.strip():
            queryset = queryset.filter(placed_at__date__gte=date_from)
        if date_to and date_to.strip():
            queryset = queryset.filter(placed_at__date__lte=date_to)

        # Filtros de precio (Clave: Convertir a número y evitar strings vacíos)
        try:
            if price_min and price_min.strip():
                queryset = queryset.filter(total_amount__gte=float(price_min))
            if price_max and price_max.strip():
                queryset = queryset.filter(total_amount__lte=float(price_max))
        except ValueError:
            pass

        return queryset

    def create(self, request):
        address = request.data.get("address")
        if not address:
            return Response(
                {"error": "La dirección es obligatoria"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = OrderService.create_from_cart(request.user, address)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=["patch"], permission_classes=[permissions.IsAdminUser]
    )
    def change_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")
        if new_status not in Order.Status.values:
            return Response(
                {"error": "Estado no válido"}, status=status.HTTP_400_BAD_REQUEST
            )

        updated_order = OrderService.update_order_status(order, new_status)
        return Response(OrderSerializer(updated_order).data)
