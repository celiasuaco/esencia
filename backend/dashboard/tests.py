from decimal import Decimal
from unittest.mock import patch

import pytest
from authentication.models import User
from django.urls import reverse
from order.models import Order, OrderItem
from product.models import Product
from rest_framework import status
from rest_framework.test import APIClient

from .services import ShowcaseService, get_admin_dashboard_stats


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email="admin@test.com",
        username="admin@test.com",
        password="password123",
        role="ADMIN",
    )


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        email="user@test.com",
        username="user@test.com",
        password="password123",
        role="CLIENT",
    )


@pytest.mark.django_db
class TestDashboardServicesUnit:
    """TESTS UNITARIOS: Validación pura de algoritmos estadísticos y lógica SQL del ORM."""

    def test_get_admin_dashboard_stats_empty_database_defaults(self):
        """Verifica que si la base de datos está totalmente vacía, el servicio compute cero de forma segura."""
        stats = get_admin_dashboard_stats()

        assert stats["total_revenue"] == 0.0
        assert stats["total_orders"] == 0
        assert stats["avg_ticket"] == 0.0
        assert stats["total_clients"] == 0
        assert stats["customer_retention"]["recurring"] == 0
        assert stats["customer_retention"]["new"] == 0
        assert stats["wishlist_vs_sales"] == []
        assert stats["monthly_sales"] == []
        assert stats["heatmap_data"] == []

    def test_customer_retention_metrics_calculation(self):
        """Valida que el cálculo de retención clasifique correctamente a clientes nuevos vs recurrentes."""
        client_new = User.objects.create_user(
            email="new@esencia.com", username="new", password="p", role="CLIENT"
        )
        client_recurring = User.objects.create_user(
            email="rec@esencia.com", username="rec", password="p", role="CLIENT"
        )

        Order.objects.create(
            user=client_new, total_amount=Decimal("50.00"), status=Order.Status.PAID
        )

        Order.objects.create(
            user=client_recurring,
            total_amount=Decimal("100.00"),
            status=Order.Status.PAID,
        )
        Order.objects.create(
            user=client_recurring,
            total_amount=Decimal("120.00"),
            status=Order.Status.DELIVERED,
        )

        stats = get_admin_dashboard_stats()

        assert stats["customer_retention"]["new"] == 1
        assert stats["customer_retention"]["recurring"] == 1

    def test_dashboard_filters_out_invalid_orders_for_revenue(self, admin_user):
        """Garantiza que pedidos cancelados o pendientes no sumen al total de ingresos netos (total_revenue)."""
        Order.objects.create(
            user=admin_user, total_amount=Decimal("200.00"), status=Order.Status.SHIPPED
        )
        Order.objects.create(
            user=admin_user, total_amount=Decimal("500.00"), status="PENDING"
        )

        stats = get_admin_dashboard_stats()
        assert stats["total_revenue"] == 200.0

    def test_heatmap_data_requires_coordinates(self, admin_user):
        """El mapa de calor de envíos debe omitir estrictamente pedidos que carezcan de latitud o longitud."""
        Order.objects.create(
            user=admin_user,
            total_amount=100,
            is_paid=True,
            latitude=40.41,
            longitude=-3.70,
        )
        Order.objects.create(
            user=admin_user,
            total_amount=150,
            is_paid=True,
            latitude=None,
            longitude=None,
        )

        stats = get_admin_dashboard_stats()
        assert len(stats["heatmap_data"]) == 1
        assert stats["heatmap_data"][0]["lat"] == 40.41

    def test_showcase_service_business_logic(self):
        """Verifica de forma unitaria que ShowcaseService clasifique correctamente existencias bajas y best sellers."""
        p1 = Product.objects.create(
            name="Anillo Diamante", price=500, stock=2, is_active=True
        )
        p2 = Product.objects.create(
            name="Collar Esencia", price=150, stock=80, is_active=True
        )

        user_test = User.objects.create_user(
            email="buyer@test.com", username="buyer", password="p"
        )
        order = Order.objects.create(user=user_test, total_amount=150)
        for _ in range(5):
            OrderItem.objects.create(
                order=order, product=p2, quantity=1, price_at_purchase=150
            )

        data = ShowcaseService.get_showcase_data()

        assert p1 in data["last_units"]
        assert p2 in data["best_sellers"]

    def test_dashboard_stats_avg_ticket_handles_division_by_zero(self):
        """Garantiza que si hay órdenes válidas pero el cálculo SQL fallase, el ticket medio devuelva 0.0 en lugar de ZeroDivisionError."""
        with patch("django.db.models.query.QuerySet.aggregate") as mock_aggregate:
            mock_aggregate.return_value = {
                "total_amount__sum": None,
                "total_amount__avg": None,
            }
            stats = get_admin_dashboard_stats()
            assert stats["avg_ticket"] == 0.0

    def test_dashboard_stats_wishlist_vs_sales_mapping(self):
        """Verifica el mapeo exacto de las claves del diccionario generado para el componente Recharts del frontend."""
        Product.objects.create(
            name="Anillo Zafiro", price=900, stock=10, is_active=True
        )
        stats = get_admin_dashboard_stats()

        product_entry = next(
            item
            for item in stats["wishlist_vs_sales"]
            if item["name"] == "Anillo Zafiro"
        )
        assert "wishlist_count" in product_entry
        assert "sale_count" in product_entry

    def test_showcase_data_filters_out_zero_stock_for_last_units(self):
        """La sección de 'Últimas Unidades' debe omitir productos cuyo stock sea 0, ya que no son comprables y distorsionan el escaparate."""
        Product.objects.create(name="Agotado", price=50, stock=0, is_active=True)
        data = ShowcaseService.get_showcase_data()

        names = [p.name for p in data["last_units"]]
        assert "Agotado" not in names

    def test_showcase_data_limits_max_items_to_four(self):
        """Regla de Negocio: El escaparate público de la Landing Page solo debe retornar un máximo de 4 elementos por sección."""
        user_test = User.objects.create_user(
            email="buyer@test.com", username="buyer", password="p"
        )
        order = Order.objects.create(user=user_test, total_amount=100)

        for i in range(6):
            prod = Product.objects.create(
                name=f"Joyas {i}", price=Decimal("100.00"), stock=2, is_active=True
            )
            OrderItem.objects.create(
                order=order, product=prod, quantity=i, price_at_purchase=prod.price
            )

        data = ShowcaseService.get_showcase_data()
        assert len(data["last_units"]) == 4
        assert len(data["best_sellers"]) == 4


@pytest.mark.django_db
class TestAdminDashboardAPI:
    """Tests de integración para el endpoint de estadísticas del dashboard admin."""

    def test_dashboard_stats_access_denied_unauthenticated(self, api_client):
        """Usuarios no autenticados no deberían acceder a las estadísticas."""
        url = reverse("admin-stats")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_dashboard_stats_access_denied_regular_user(self, api_client, regular_user):
        """Usuarios regulares no deberían acceder a las estadísticas."""
        url = reverse("admin-stats")
        api_client.force_authenticate(user=regular_user)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_dashboard_stats_success_as_admin(self, api_client, admin_user):
        """Usuarios admin deberían acceder y recibir estadísticas correctas."""
        User.objects.create_user(email="u1@t.com", username="u1@t.com", password="p")
        Product.objects.create(name="Low Stock", price=10, stock=2, category="ANILLO")

        Order.objects.create(
            user=admin_user,
            address="Calle Falsa 123",
            total_amount=Decimal("150.00"),
            status=Order.Status.PAID,
        )

        url = reverse("admin-stats")
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.data

        assert "total_revenue" in data
        assert "total_clients" in data
        assert "customer_retention" in data
        assert "wishlist_vs_sales" in data
        assert "monthly_sales" in data

        assert data["total_revenue"] == 150.0
        assert data["total_orders"] >= 1


@pytest.mark.django_db
class TestShowcaseAPI:
    """Tests de integración para el endpoint de productos destacados del dashboard."""

    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.low_stock_prod = Product.objects.create(
            name="Anillo Único",
            price=99.99,
            stock=3,
            is_active=True,
            category="Anillos",
        )

        self.high_stock_prod = Product.objects.create(
            name="Collar Infinito",
            price=199.99,
            stock=50,
            is_active=True,
            category="Collares",
        )

        self.best_seller = Product.objects.create(
            name="Pulsera Tendencia",
            price=50.00,
            stock=20,
            is_active=True,
            category="Pulseras",
        )

        user = User.objects.create_user(
            email="test@esencia.com", username="testuser_showcase", password="pass123"
        )

        order = Order.objects.create(
            user=user, address="Calle Falsa 123", total_amount=150.00
        )

        for _ in range(3):
            OrderItem.objects.create(
                order=order,
                product=self.best_seller,
                quantity=1,
                price_at_purchase=50.00,
            )

        self.url = reverse("showcase-products")

    def test_showcase_endpoint_returns_200(self, api_client):
        """El endpoint debe responder con 200 OK y tener las claves esperadas."""
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert "last_units" in response.data
        assert "best_sellers" in response.data

    def test_last_units_threshold_is_strict(self, api_client):
        """Solo productos con stock < 5 deberían aparecer en last_units."""
        response = api_client.get(self.url)
        last_units = response.data["last_units"]
        names = [p["name"] for p in last_units]

        assert "Anillo Único" in names
        assert "Collar Infinito" not in names

        for prod in last_units:
            assert prod["stock"] < 5

    def test_best_sellers_ordering_logic(self, api_client):
        """Los productos más vendidos deben aparecer en el orden correcto."""
        response = api_client.get(self.url)
        best_sellers = response.data["best_sellers"]

        assert best_sellers[0]["name"] == "Pulsera Tendencia"

    def test_inactive_products_are_hidden(self, api_client):
        """Los productos inactivos no deberían aparecer en ninguna lista."""
        self.low_stock_prod.is_active = False
        self.low_stock_prod.save()

        response = api_client.get(self.url)
        ids_in_response = [p["id"] for p in response.data["last_units"]] + [
            p["id"] for p in response.data["best_sellers"]
        ]

        assert self.low_stock_prod.id not in ids_in_response

    def test_empty_showcase_returns_empty_lists(self, api_client):
        """Cuando no hay productos, se deben devolver listas vacías."""
        Product.objects.all().delete()
        response = api_client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["last_units"] == []
        assert response.data["best_sellers"] == []
