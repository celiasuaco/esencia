from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from product.models import Product
from rest_framework import status
from rest_framework.test import APIClient

from .models import Cart, CartItem

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser", password="password123", email="test@esencia.com"
    )


@pytest.fixture
def product(db):
    return Product.objects.create(
        name="Anillo Esencia", price=150.00, stock=10, category="ANILLO"
    )


@pytest.mark.django_db
class TestCart:
    def test_add_to_cart_authenticated(self, api_client, user, product):
        api_client.force_authenticate(user=user)
        response = api_client.post(
            reverse("cart-add"), {"product_id": product.id, "quantity": 2}
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert CartItem.objects.filter(status=CartItem.Status.ACTIVE).count() == 1

    def test_remove_item_authenticated_soft_delete(self, api_client, user, product):
        """Verifica que al eliminar un item, no se borra de la DB sino que cambia a ABANDONED"""
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)
        item = CartItem.objects.create(
            cart=cart, product=product, quantity=1, status=CartItem.Status.ACTIVE
        )

        response = api_client.delete(
            reverse("cart-item-update", kwargs={"item_id": item.id})
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verificación de persistencia para métricas ES-20
        item.refresh_from_db()
        assert item.status == CartItem.Status.ABANDONED

        # Verificamos que el detalle del carrito lo ignore
        detail = api_client.get(reverse("cart-detail"))
        assert len(detail.data["items"]) == 0

    def test_shipping_calculation(self, api_client, user):
        api_client.force_authenticate(user=user)
        p_cheap = Product.objects.create(
            name="Joyita Test", price=Decimal("20.00"), stock=50, category="ANILLO"
        )
        api_client.post(reverse("cart-add"), {"product_id": p_cheap.id, "quantity": 1})

        res1 = api_client.get(reverse("cart-detail"))
        assert float(res1.data["shipping"]) == 4.99

        api_client.post(reverse("cart-add"), {"product_id": p_cheap.id, "quantity": 5})
        res2 = api_client.get(reverse("cart-detail"))
        assert float(res2.data["shipping"]) == 0.00
