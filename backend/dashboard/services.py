from datetime import timedelta

from authentication.models import User
from django.db.models import Sum
from django.utils import timezone
from order.models import Order
from product.models import Product


def get_admin_dashboard_stats():
    """
    Calcula las métricas clave para el panel de administración.
    Utiliza agregaciones de base de datos para optimizar el rendimiento.
    """
    last_30_days = timezone.now() - timedelta(days=30)

    # Cálculo de ingresos totales sumando el campo físico total_amount
    # Solo consideramos pedidos que ya han sido pagados (PAID, SHIPPED, DELIVERED)
    total_revenue = (
        Order.objects.filter(
            status__in=[Order.Status.PAID, Order.Status.SHIPPED, Order.Status.DELIVERED]
        ).aggregate(Sum("total_amount"))["total_amount__sum"]
        or 0
    )

    # Métricas de pedidos: totales vs pendientes de pago
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status=Order.Status.PENDING).count()

    return {
        "metrics": {
            "users": {
                "total_count": User.objects.count(),
                "new_last_30d": User.objects.filter(
                    date_joined__gte=last_30_days
                ).count(),
            },
            "sales": {
                "total_revenue": float(total_revenue),
                "currency": "EUR",
                "total_orders": total_orders,
                "pending_orders": pending_orders,
            },
            "inventory": {
                "low_stock_alerts": Product.objects.filter(stock__lt=5).count(),
                "total_products": Product.objects.count(),
            },
        },
        "generated_at": timezone.now(),
    }
