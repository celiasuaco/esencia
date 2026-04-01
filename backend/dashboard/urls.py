from django.urls import path

from .views import AdminDashboardStatsView

urlpatterns = [
    path("", AdminDashboardStatsView.as_view(), name="admin-stats"),
]
