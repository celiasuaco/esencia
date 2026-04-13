from datetime import timedelta

from authentication.models import User
from django.db.models import Avg, Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from order.models import Order
from product.models import Product


def get_admin_dashboard_stats():
    now = timezone.now()
    six_months_ago = now - timedelta(days=180)

    # --- 1. KPIs BASE ---
    valid_orders = Order.objects.filter(
        status__in=[Order.Status.PAID, Order.Status.SHIPPED, Order.Status.DELIVERED]
    )

    stats = {
        "total_revenue": float(
            valid_orders.aggregate(Sum("total_amount"))["total_amount__sum"] or 0
        ),
        "total_orders": Order.objects.count(),
        "avg_ticket": float(
            valid_orders.aggregate(Avg("total_amount"))["total_amount__avg"] or 0
        ),
        "total_clients": User.objects.filter(role="CLIENT").count(),
    }

    # --- 2. TASA DE RETORNO ---
    clients_with_orders = User.objects.filter(role="CLIENT").annotate(
        num_orders=Count(
            "orders",
            filter=Q(orders__status__in=[Order.Status.PAID, Order.Status.DELIVERED]),
        )
    )

    recurring_customers = clients_with_orders.filter(num_orders__gt=1).count()
    one_time_customers = clients_with_orders.filter(num_orders=1).count()

    stats["customer_retention"] = {
        "recurring": recurring_customers,
        "new": one_time_customers,
    }

    # --- 3. DESEO (CARRITO) VS VENTA ---
    top_desired_products = (
        Product.objects.filter(is_active=True)
        .annotate(
            wishlist_count=Count(
                "cart_items",
                filter=Q(cart_items__status="ACTIVE"),
                distinct=True,
            ),
            sale_count=Count(
                "orderitem",
                filter=Q(
                    orderitem__order__status__in=[
                        Order.Status.PAID,
                        Order.Status.DELIVERED,
                    ]
                ),
                distinct=True,
            ),
        )
        .order_by("-wishlist_count")[:5]
    )

    stats["wishlist_vs_sales"] = [
        {"name": p.name, "wishlist_count": p.wishlist_count, "sale_count": p.sale_count}
        for p in top_desired_products
    ]

    # --- 4. VENTAS MENSUALES ---
    monthly_stats = (
        valid_orders.filter(placed_at__gte=six_months_ago)
        .annotate(month=TruncMonth("placed_at"))
        .values("month")
        .annotate(total=Sum("total_amount"))
        .order_by("month")
    )

    stats["monthly_sales"] = [
        {"label": s["month"].strftime("%b %Y"), "value": float(s["total"])}
        for s in monthly_stats
    ]

    return stats


class ShowcaseService:
    @staticmethod
    def get_showcase_data():
        last_units = Product.objects.filter(
            is_active=True, stock__gt=0, stock__lte=5
        ).order_by("stock")[:4]

        best_sellers = (
            Product.objects.filter(is_active=True)
            .annotate(total_sales=Count("orderitem"))
            .order_by("-total_sales", "-id")[:4]
        )

        return {"last_units": last_units, "best_sellers": best_sellers}
