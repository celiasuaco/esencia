from product.serializers import ProductSerializer
from rest_framework import serializers


class ShowcaseSerializer(serializers.Serializer):
    """Serializador para la vista del escaparate (Últimas unidades y Best Sellers)"""

    last_units = ProductSerializer(many=True)
    best_sellers = ProductSerializer(many=True)


class DashboardChartDataSerializer(serializers.Serializer):
    """Serializador para los datos del gráfico de datos del dashboard."""

    label = serializers.CharField()
    value = serializers.FloatField()


class ComparisonChartSerializer(serializers.Serializer):
    """Serializador para el gráfico de comparación."""

    name = serializers.CharField()
    wishlist_count = serializers.IntegerField()
    sale_count = serializers.IntegerField()


class HeatmapPointSerializer(serializers.Serializer):
    """Serializador para los puntos del mapa de calor."""

    lat = serializers.FloatField()
    lng = serializers.FloatField()
    amount = serializers.FloatField()


class AdminDashboardStatsSerializer(serializers.Serializer):
    """Serializador para las estadísticas del dashboard de administración."""

    total_revenue = serializers.FloatField()
    total_orders = serializers.IntegerField()
    avg_ticket = serializers.FloatField()
    total_clients = serializers.IntegerField()

    customer_retention = serializers.DictField()
    wishlist_vs_sales = ComparisonChartSerializer(many=True)
    monthly_sales = DashboardChartDataSerializer(many=True)
    heatmap_data = HeatmapPointSerializer(many=True)
