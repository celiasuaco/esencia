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
    """TESTS UNITARIOS: Lógica de negocio pura, filtros avanzados y mutaciones de catálogo."""

    def test_create_product(self):
        """[Existente] Testea la creación de un producto usando el servicio."""
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
        """[Existente] Testea el borrado lógico de un producto usando el servicio."""
        ProductService.soft_delete(sample_product)
        sample_product.refresh_from_db()
        assert sample_product.is_active is False

    def test_get_all_products_filtering(self, sample_product):
        """[Existente] Testea la obtención de productos activos e inactivos usando el servicio."""
        Product.objects.create(
            name="Inactivo", is_active=False, price=Decimal("10.00"), category="ANILLO"
        )

        products = ProductService.get_all_products(include_inactive=False)
        assert products.count() == 1

        all_products = ProductService.get_all_products(include_inactive=True)
        assert all_products.count() == 2

    def test_update_product_service_mutates_fields(self, sample_product):
        """NUEVO: Verifica que el servicio mapee y guarde dinámicamente modificaciones parciales."""
        update_data = {"name": "Anillo Oro 18K", "stock": 4}
        updated_prod = ProductService.update_product(sample_product, update_data)

        assert updated_prod.name == "Anillo Oro 18K"
        assert updated_prod.stock == 4
        sample_product.refresh_from_db()
        assert sample_product.name == "Anillo Oro 18K"

    def test_get_all_products_filter_by_price_range(self):
        """NUEVO: Comprueba que el filtrado por min_price y max_price aísle los productos fuera de rango."""
        Product.objects.create(
            name="Económico",
            price=Decimal("20.00"),
            category="PENDIENTE",
            is_active=True,
        )
        Product.objects.create(
            name="Medio", price=Decimal("60.00"), category="PENDIENTE", is_active=True
        )
        Product.objects.create(
            name="Premium",
            price=Decimal("150.00"),
            category="PENDIENTE",
            is_active=True,
        )

        filters = {"min_price": Decimal("50.00"), "max_price": Decimal("100.00")}
        results = ProductService.get_all_products(filters=filters)

        assert results.count() == 1
        assert results.first().name == "Medio"

    def test_get_all_products_filter_case_insensitive_attributes(self):
        """NUEVO: Valida que el filtrado por material y categoría ignore diferencias de tipografía (iexact)."""
        Product.objects.create(
            name="Gargantilla",
            price=100,
            material="PLATA",
            category="Collares",
            is_active=True,
        )

        filters = {"material": "plata", "category": "COLLARES"}
        results = ProductService.get_all_products(filters=filters)

        assert results.count() == 1
        assert results.first().name == "Gargantilla"

    def test_get_all_products_sorting_variants(self):
        """NUEVO: Verifica las tres ordenaciones soportadas: precio ascendente, descendente y por nombre."""
        p_b = Product.objects.create(
            name="Brazalete", price=Decimal("300.00"), is_active=True
        )
        p_a = Product.objects.create(
            name="Alfiler", price=Decimal("50.00"), is_active=True
        )

        asc_results = ProductService.get_all_products(sort_by="price_asc")
        assert asc_results.first() == p_a

        desc_results = ProductService.get_all_products(sort_by="price_desc")
        assert desc_results.first() == p_b

        default_results = ProductService.get_all_products(sort_by="unknown_variant")
        assert default_results.first() == p_a


@pytest.mark.django_db
class TestProductAPI:
    """[Existente] Tests de integración para los endpoints de productos."""

    url_list = reverse("products-list")

    def test_public_can_list_active_products(self, api_client, sample_product):
        """[Existente] Testea que usuarios no autenticados solo vean productos activos."""
        Product.objects.create(
            name="Oculto", is_active=False, price=10, category="ANILLO"
        )

        response = api_client.get(self.url_list)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_admin_can_create_product(self, api_client, admin_user):
        """[Existente] Testea que un admin pueda crear un producto a través del API."""
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
        """[Existente] Testea que un cliente no pueda crear un producto a través del API."""
        api_client.force_authenticate(user=client_user)
        data = {"name": "Intento Fallido", "price": "100.00", "category": "ANILLO"}
        response = api_client.post(self.url_list, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_update_product(self, api_client, admin_user, sample_product):
        """[Existente] Testea que un admin pueda actualizar un producto a través del API."""
        api_client.force_authenticate(user=admin_user)
        url_detail = reverse("products-detail", kwargs={"pk": sample_product.pk})

        response = api_client.patch(url_detail, {"price": "120.00"})
        assert response.status_code == status.HTTP_200_OK
        sample_product.refresh_from_db()
        assert sample_product.price == Decimal("120.00")

    def test_admin_can_soft_delete_via_api(
        self, api_client, admin_user, sample_product
    ):
        """[Existente] Testea que un admin pueda realizar un borrado lógico a través del API."""
        api_client.force_authenticate(user=admin_user)
        url_detail = reverse("products-detail", kwargs={"pk": sample_product.pk})

        response = api_client.delete(url_detail)
        assert response.status_code == status.HTTP_200_OK
        sample_product.refresh_from_db()
        assert sample_product.is_active is False
