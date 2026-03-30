from decimal import Decimal

import pytest
from authentication.models import User
from django.urls import reverse
from order.models import Order
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
        # 1. Crear datos de prueba (Mock data)
        # Creamos un usuario adicional para probar el conteo
        User.objects.create_user(email="u1@t.com", username="u1@t.com", password="p")

        # Crear productos para probar alertas de stock
        # (Asegúrate de incluir la categoría si es obligatoria en tu modelo Product)
        Product.objects.create(name="Low Stock", price=10, stock=2, category="ANILLO")
        Product.objects.create(name="High Stock", price=20, stock=10, category="COLLAR")

        # Crear un pedido pagado vinculado al admin_user (para evitar el IntegrityError)
        # Incluimos total_amount directamente ya que ahora es un campo de la DB
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

        # Verificar la nueva estructura del servicio
        data = response.data

        # Estructura de Usuarios
        assert "users" in data["metrics"]
        # admin_user + u1 = 2 (regular_user no se crea a menos que se use la fixture explícitamente)
        assert data["metrics"]["users"]["total_count"] >= 2

        # Estructura de Ventas
        assert "sales" in data["metrics"]
        assert data["metrics"]["sales"]["total_revenue"] == 150.0
        assert data["metrics"]["sales"]["total_orders"] == 1

        # Estructura de Inventario
        assert "inventory" in data["metrics"]
        assert data["metrics"]["inventory"]["low_stock_alerts"] == 1
