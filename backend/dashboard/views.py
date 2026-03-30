from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsSuperAdmin  # El que creamos antes
from .services import get_admin_dashboard_stats


class AdminDashboardStatsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        stats = get_admin_dashboard_stats()
        return Response(stats)
