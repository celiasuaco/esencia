from django.db.models import Count
from product.models import Product
from product.serializers import ProductSerializer
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsSuperAdmin
from .serializers import AdminDashboardStatsSerializer
from .services import get_admin_dashboard_stats


class AdminDashboardStatsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        data = get_admin_dashboard_stats()

        serializer = AdminDashboardStatsSerializer(data)

        return Response(serializer.data)


class ShowcaseView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        last_units_qs = Product.objects.filter(
            is_active=True,
            stock__gt=0,
            stock__lt=5,
        ).order_by("stock")[:4]

        best_sellers_qs = (
            Product.objects.filter(is_active=True)
            .annotate(total_sales=Count("orderitem"))
            .order_by("-total_sales", "-id")[:4]
        )

        return Response(
            {
                "last_units": ProductSerializer(last_units_qs, many=True).data,
                "best_sellers": ProductSerializer(best_sellers_qs, many=True).data,
            }
        )
