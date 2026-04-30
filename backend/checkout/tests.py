from decimal import Decimal
from unittest.mock import MagicMock

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
    """Proporciona un cliente de prueba de API de Django Rest Framework."""
    return APIClient()


@pytest.fixture
def user(db):
    """Crea un usuario de prueba en la base de datos."""
    return User.objects.create_user(
        username="testuser", password="password123", email="test@esencia.com"
    )


@pytest.fixture
def product(db):
    """Crea un producto de prueba (anillo) con stock inicial."""
    return Product.objects.create(
        name="Anillo Esencia", price=150.00, stock=10, category="ANILLO"
    )


@pytest.mark.django_db
class TestCart:
    """Conjunto de pruebas para validar la lógica del carrito de compras y la integración con pagos."""

    def test_add_to_cart_authenticated(self, api_client, user, product):
        """Comprueba que un usuario logueado puede añadir productos a su carrito correctamente."""
        api_client.force_authenticate(user=user)
        response = api_client.post(
            reverse("cart-add"), {"product_id": product.id, "quantity": 2}
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert CartItem.objects.filter(status=CartItem.Status.ACTIVE).count() == 1

    def test_remove_item_authenticated_soft_delete(self, api_client, user, product):
        """Valida que eliminar un item no lo borra físicamente, sino que cambia su estado a ABANDONED."""
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)
        item = CartItem.objects.create(
            cart=cart, product=product, quantity=1, status=CartItem.Status.ACTIVE
        )

        response = api_client.delete(
            reverse("cart-item-update", kwargs={"item_id": item.id})
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

        item.refresh_from_db()
        assert item.status == CartItem.Status.ABANDONED

        detail = api_client.get(reverse("cart-detail"))
        assert len(detail.data["items"]) == 0

    def test_shipping_calculation(self, api_client, user):
        """Verifica que los gastos de envío se aplican por debajo de 100€ y son gratuitos por encima."""
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

    def test_create_checkout_session_authenticated(self, api_client, user, product):
        """Valida la generación de una sesión de Stripe incluyendo los metadatos de dirección de envío."""
        cart, _ = Cart.objects.get_or_create(user=user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)

        api_client.force_authenticate(user=user)
        url = reverse("create-payment-session")

        payload = {
            "address_data": {
                "address": "Calle Falsa 123, Madrid, Spain",
                "lat": 40.4167,
                "lng": -3.7033,
            }
        }

        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "url" in response.data

    def test_payment_success_logic(self, db, user, product):
        """Comprueba que tras un pago exitoso se crea el pedido, se reduce el stock y se vacía el carrito."""
        from .views import process_payment_success

        cart = Cart.objects.create(user=user)
        CartItem.objects.create(
            cart=cart, product=product, quantity=2, status=CartItem.Status.ACTIVE
        )

        initial_stock = product.stock

        mock_session = MagicMock()
        mock_session.metadata = {
            "user_id": user.id,
            "address": "Calle de Prueba, 10",
            "latitude": 40.0,
            "longitude": -3.0,
        }

        process_payment_success(mock_session)

        from order.models import Order

        assert Order.objects.filter(user=user).count() == 1

        product.refresh_from_db()
        assert product.stock == initial_stock - 2

        assert Cart.objects.filter(user=user).count() == 0
