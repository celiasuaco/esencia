from product.serializers import ProductSerializer
from rest_framework import serializers


class ShowcaseSerializer(serializers.Serializer):
    last_units = ProductSerializer(many=True)
    best_sellers = ProductSerializer(many=True)


class DashboardChartDataSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.FloatField()


class ComparisonChartSerializer(serializers.Serializer):
    name = serializers.CharField()
    wishlist_count = serializers.IntegerField()
    sale_count = serializers.IntegerField()


class AdminDashboardStatsSerializer(serializers.Serializer):
    # KPIs base
    total_revenue = serializers.FloatField()
    total_orders = serializers.IntegerField()
    avg_ticket = serializers.FloatField()
    total_clients = serializers.IntegerField()

    # Clientes recurrentes vs Nuevos
    customer_retention = serializers.DictField()

    # Deseo vs Venta (Top 5 productos)
    wishlist_vs_sales = ComparisonChartSerializer(many=True)

    # Ventas Mensuales
    monthly_sales = DashboardChartDataSerializer(many=True)
