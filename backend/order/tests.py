from unittest.mock import MagicMock

import pytest
from checkout.models import Cart, CartItem
from checkout.views import process_payment_success
from django.contrib.auth import get_user_model
from django.urls import reverse
from product.models import Product
from rest_framework import status
from rest_framework.test import APIClient

from .models import Order

User = get_user_model()


@pytest.fixture
def api_client():
    """Proporciona el cliente de API de Django Rest Framework"""
    return APIClient()


@pytest.fixture
def user(db):
    """Crea un usuario de prueba"""
    return User.objects.create_user(
        username="testuser", password="password123", email="test@esencia.com"
    )


@pytest.fixture
def product(db):
    """Crea un producto inicial de prueba"""
    return Product.objects.create(
        name="Anillo Esencia", price=150.00, stock=10, category="ANILLO"
    )


@pytest.mark.django_db
class TestOrders:
    def test_create_order_flow(self, api_client, user, product):
        """Test del flujo completo: Carrito -> Pago -> Creación de Pedido"""
        cart, _ = Cart.objects.get_or_create(user=user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)

        mock_session = MagicMock()
        mock_session.metadata = {"user_id": user.id, "address": "Calle Mayor, 1"}

        process_payment_success(mock_session)

        assert Order.objects.count() == 1
        order = Order.objects.first()
        assert order.user == user
        assert order.status == "PAID"
        assert order.is_paid is True
        assert float(order.total_amount) > 0

        assert Cart.objects.filter(user=user).count() == 0

    def test_admin_can_change_status_and_is_paid_updates(self, api_client, user):
        # Configurar admin
        admin = user
        admin.is_staff = True
        admin.save()

        order = Order.objects.create(
            user=user, address="Test Address", status=Order.Status.PAID
        )
        api_client.force_authenticate(user=admin)

        url = reverse("order-change-status", kwargs={"pk": order.pk})
        response = api_client.patch(url, {"status": Order.Status.PAID})

        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == Order.Status.PAID
        assert order.is_paid is True

    def test_client_cannot_see_others_orders(self, api_client, user, product):
        # Crear otro usuario y su pedido
        otro_user = User.objects.create_user(
            username="otro", email="otro@test.com", password="123"
        )
        order_ajena = Order.objects.create(user=otro_user, address="Direccion Ajena")

        api_client.force_authenticate(user=user)
        url = reverse("order-detail", kwargs={"pk": order_ajena.pk})
        response = api_client.get(url)

        assert response.status_code in [
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_admin_search_by_tracking_code(self, api_client, user):
        admin = user
        admin.is_staff = True
        admin.save()

        order = Order.objects.create(user=user, address="Search Test")
        api_client.force_authenticate(user=admin)

        # Buscar por tracking code
        url = f"{reverse('order-list')}?tracking={order.tracking_code}"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["tracking_code"] == order.tracking_code

    def test_admin_can_access_any_order(self, api_client, user):
        """Path 1: is_staff=True -> True"""
        # Crear un admin y un pedido de un tercero
        admin = user
        admin.is_staff = True
        admin.save()

        otro_user = user.__class__.objects.create_user(
            username="otro", email="o@t.com", password="1"
        )
        order_ajena = Order.objects.create(user=otro_user, address="Calle Admin")

        api_client.force_authenticate(user=admin)
        url = reverse("order-detail", kwargs={"pk": order_ajena.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_owner_can_access_own_order(self, api_client, user):
        """Path 2: obj.user == request.user -> True"""
        order_propia = Order.objects.create(user=user, address="Mi Casa")

        api_client.force_authenticate(user=user)
        url = reverse("order-detail", kwargs={"pk": order_propia.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_user_cannot_access_other_order(self, api_client, user):
        """Path 3: obj.user != request.user -> False"""
        otro_user = user.__class__.objects.create_user(
            username="cliente2", email="c2@t.com", password="1"
        )
        order_ajena = Order.objects.create(user=otro_user, address="Calle Ajena")

        api_client.force_authenticate(user=user)
        url = reverse("order-detail", kwargs={"pk": order_ajena.pk})
        response = api_client.get(url)

        assert response.status_code in [
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN,
        ]
