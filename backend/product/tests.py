from decimal import Decimal

import pytest
from authentication.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from product.models import Product
from product.services import ProductService


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


@pytest.mark.django_db
class TestProductService:
    """Tests unitarios para la lógica de negocio de productos."""

    def test_create_product(self):
        """Testea la creación de un producto usando el servicio."""
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
        """Testea el borrado lógico de un producto usando el servicio."""
        ProductService.soft_delete(sample_product)
        sample_product.refresh_from_db()
        assert sample_product.is_active is False

    def test_get_all_products_filtering(self, sample_product):
        """Testea la obtención de productos activos e inactivos usando el servicio."""
        Product.objects.create(
            name="Inactivo", is_active=False, price=Decimal("10.00"), category="ANILLO"
        )

        products = ProductService.get_all_products(include_inactive=False)
        assert products.count() == 1

        all_products = ProductService.get_all_products(include_inactive=True)
        assert all_products.count() == 2


@pytest.mark.django_db
class TestProductAPI:
    """Tests de integración para los endpoints de productos."""

    url_list = reverse("products-list")

    def test_public_can_list_active_products(self, api_client, sample_product):
        """Testea que usuarios no autenticados solo vean productos activos."""
        Product.objects.create(
            name="Oculto", is_active=False, price=10, category="ANILLO"
        )

        response = api_client.get(self.url_list)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_admin_can_create_product(self, api_client, admin_user):
        """Testea que un admin pueda crear un producto a través del API."""
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
        """Testea que un cliente no pueda crear un producto a través del API."""
        api_client.force_authenticate(user=client_user)
        data = {"name": "Intento Fallido", "price": "100.00", "category": "ANILLO"}
        response = api_client.post(self.url_list, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_update_product(self, api_client, admin_user, sample_product):
        """Testea que un admin pueda actualizar un producto a través del API."""
        api_client.force_authenticate(user=admin_user)
        url_detail = reverse("products-detail", kwargs={"pk": sample_product.pk})

        response = api_client.patch(url_detail, {"price": "120.00"})
        assert response.status_code == status.HTTP_200_OK
        sample_product.refresh_from_db()
        assert sample_product.price == Decimal("120.00")

    def test_admin_can_soft_delete_via_api(
        self, api_client, admin_user, sample_product
    ):
        """Testea que un admin pueda realizar un borrado lógico a través del API."""
        api_client.force_authenticate(user=admin_user)
        url_detail = reverse("products-detail", kwargs={"pk": sample_product.pk})

        response = api_client.delete(url_detail)
        assert response.status_code == status.HTTP_200_OK
        sample_product.refresh_from_db()
        assert sample_product.is_active is False
