from decimal import Decimal

import pytest
from authentication.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from product.models import Product
from product.services import ProductService

# --- FIXTURES ---


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin", email="admin@test.com", password="password123", role="ADMIN"
    )


@pytest.fixture
def client_user(db):
    return User.objects.create_user(
        username="client",
        email="client@test.com",
        password="password123",
        role="CLIENT",
    )


@pytest.fixture
def sample_product(db):
    return Product.objects.create(
        name="Anillo Oro",
        description="Anillo de prueba",
        category="ANILLO",
        price=Decimal("100.00"),
        stock=10,
        material="Oro",
    )


# --- TESTS DE SERVICIO (Lógica de Negocio) ---


@pytest.mark.django_db
class TestProductService:
    def test_create_product(self):
        data = {
            "name": "Collar Perlas",
            "description": "Hermoso collar",
            "category": "COLLAR",
            "price": Decimal("50.00"),
            "stock": 5,
        }
        product = ProductService.create_product(data)
        assert product.name == "Collar Perlas"
        assert Product.objects.count() == 1

    def test_soft_delete(self, sample_product):
        ProductService.soft_delete(sample_product)
        sample_product.refresh_from_db()
        assert sample_product.is_active is False

    def test_get_all_products_filtering(self, sample_product):
        # Creamos uno inactivo
        Product.objects.create(
            name="Inactivo", is_active=False, price=Decimal("10.00"), category="ANILLO"
        )

        # El cliente/público no debe ver el inactivo
        products = ProductService.get_all_products(include_inactive=False)
        assert products.count() == 1

        # El admin debe ver todos (activos e inactivos)
        all_products = ProductService.get_all_products(include_inactive=True)
        assert all_products.count() == 2


# --- TESTS DE API (Rutas y Permisos) ---


@pytest.mark.django_db
class TestProductAPI:
    # El basename en el router es 'products', por lo tanto la ruta es 'products-list'
    url_list = reverse("products-list")

    def test_public_can_list_active_products(self, api_client, sample_product):
        # Creamos uno inactivo que no debería aparecer
        Product.objects.create(
            name="Oculto", is_active=False, price=10, category="ANILLO"
        )

        response = api_client.get(self.url_list)
        assert response.status_code == status.HTTP_200_OK
        # Solo debe devolver el activo
        assert len(response.data) == 1

    def test_admin_can_create_product(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        data = {
            "name": "Pulsera Plata",
            "description": "Nueva joya",
            "category": "PULSERA",
            "price": "45.00",
            "stock": 10,
            "material": "Plata",
        }
        response = api_client.post(self.url_list, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Product.objects.filter(name="Pulsera Plata").exists()

    def test_client_cannot_create_product(self, api_client, client_user):
        api_client.force_authenticate(user=client_user)
        data = {"name": "Intento Fallido", "price": "100.00", "category": "ANILLO"}
        response = api_client.post(self.url_list, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_update_product(self, api_client, admin_user, sample_product):
        api_client.force_authenticate(user=admin_user)
        url_detail = reverse("products-detail", kwargs={"pk": sample_product.pk})

        response = api_client.patch(url_detail, {"price": "120.00"})
        assert response.status_code == status.HTTP_200_OK
        sample_product.refresh_from_db()
        assert sample_product.price == Decimal("120.00")

    def test_admin_can_soft_delete_via_api(
        self, api_client, admin_user, sample_product
    ):
        api_client.force_authenticate(user=admin_user)
        url_detail = reverse("products-detail", kwargs={"pk": sample_product.pk})

        response = api_client.delete(url_detail)
        assert response.status_code == status.HTTP_200_OK
        sample_product.refresh_from_db()
        assert sample_product.is_active is False
