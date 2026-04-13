from decimal import Decimal

import pytest
from authentication.models import User
from django.contrib.auth import get_user_model
from django.urls import reverse
from order.models import Order, OrderItem
from product.models import Product
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


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
    def test_dashboard_stats_access_denied_unauthenticated(self, api_client):
        url = reverse("admin-stats")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_dashboard_stats_access_denied_regular_user(self, api_client, regular_user):
        url = reverse("admin-stats")
        api_client.force_authenticate(user=regular_user)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_dashboard_stats_success_as_admin(self, api_client, admin_user):
        # 1. Preparar datos
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

        # 2. Verificaciones
        assert response.status_code == status.HTTP_200_OK
        data = response.data

        # Verificamos la estructura plana actual (sin el nivel 'metrics')
        assert "total_revenue" in data
        assert "total_clients" in data
        assert "customer_retention" in data
        assert "wishlist_vs_sales" in data
        assert "monthly_sales" in data

        # Verificamos valores específicos
        assert data["total_revenue"] == 150.0
        assert data["total_orders"] >= 1


@pytest.mark.django_db
class TestShowcase:
    @pytest.fixture(autouse=True)
    def setup_data(self):
        # 1. Producto con stock bajo (debe aparecer en last_units)
        self.low_stock_prod = Product.objects.create(
            name="Anillo Único",
            price=99.99,
            stock=3,
            is_active=True,
            category="Anillos",
        )

        # 2. Producto con mucho stock (no debe aparecer en last_units)
        self.high_stock_prod = Product.objects.create(
            name="Collar Infinito",
            price=199.99,
            stock=50,
            is_active=True,
            category="Collares",
        )

        # 3. Producto para más vendidos
        self.best_seller = Product.objects.create(
            name="Pulsera Tendencia",
            price=50.00,
            stock=20,
            is_active=True,
            category="Pulseras",
        )

        # Simulamos ventas para la pulsera
        user = User.objects.create_user(
            email="test@esencia.com", username="testuser_showcase", password="pass123"
        )

        # Creamos la orden
        order = Order.objects.create(
            user=user, address="Calle Falsa 123", total_amount=150.00
        )

        # CORRECCIÓN: Usamos price_at_purchase según tu modelo OrderItem
        for _ in range(3):
            OrderItem.objects.create(
                order=order,
                product=self.best_seller,
                quantity=1,
                price_at_purchase=50.00,
            )

        self.url = reverse("showcase-products")

    def test_showcase_endpoint_returns_200(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert "last_units" in response.data
        assert "best_sellers" in response.data

    def test_last_units_threshold_is_strict(self, api_client):
        response = api_client.get(self.url)
        last_units = response.data["last_units"]
        names = [p["name"] for p in last_units]

        assert "Anillo Único" in names
        assert "Collar Infinito" not in names

        for prod in last_units:
            assert prod["stock"] < 5

    def test_best_sellers_ordering_logic(self, api_client):
        response = api_client.get(self.url)
        best_sellers = response.data["best_sellers"]

        # El producto con 3 ventas (Pulsera Tendencia) debe ser el primero
        assert best_sellers[0]["name"] == "Pulsera Tendencia"

    def test_inactive_products_are_hidden(self, api_client):
        self.low_stock_prod.is_active = False
        self.low_stock_prod.save()

        response = api_client.get(self.url)
        ids_in_response = [p["id"] for p in response.data["last_units"]] + [
            p["id"] for p in response.data["best_sellers"]
        ]

        assert self.low_stock_prod.id not in ids_in_response

    def test_empty_showcase_returns_empty_lists(self, api_client):
        Product.objects.all().delete()
        response = api_client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["last_units"] == []
        assert response.data["best_sellers"] == []
