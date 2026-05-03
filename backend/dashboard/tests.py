from decimal import Decimal

import pytest
from authentication.models import User
from django.urls import reverse
from order.models import Order, OrderItem
from product.models import Product
from rest_framework import status
from rest_framework.test import APIClient


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
class TestAdminDashboard:
    """Tests para el endpoint de estadísticas del dashboard admin."""

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
class TestShowcase:
    """Tests para el endpoint de productos destacados del dashboard."""

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
