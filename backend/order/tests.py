from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from checkout.models import Cart, CartItem
from checkout.views import process_payment_success
from django.contrib.auth import get_user_model
from django.urls import reverse
from product.models import Product
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from .models import Order, OrderItem
from .services import OrderService

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
class TestOrderServiceUnit:
    """NUEVOS TESTS UNITARIOS: Aislamiento total de las funciones de lógica y mutación de pedidos."""

    def test_create_from_cart_empty_cart_raises_validation_error(self, user):
        """El servicio debe lanzar una ValidationError si el carrito del usuario no contiene items activos."""
        Cart.objects.create(user=user)

        with pytest.raises(ValidationError) as exc_info:
            OrderService.create_from_cart(user=user, address="Calle Gran Vía 1")
        assert "El carrito está vacío." in str(exc_info.value)

    def test_create_from_cart_insufficient_stock_raises_validation_error(
        self, user, product
    ):
        """Garantiza que el servicio aborte la creación e informe si la cantidad supera las existencias físicas."""
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(
            cart=cart, product=product, quantity=15, status=CartItem.Status.ACTIVE
        )

        with pytest.raises(ValidationError) as exc_info:
            OrderService.create_from_cart(user=user, address="Avenida Constitución 45")
        assert "no tiene stock suficiente" in str(exc_info.value)

    def test_create_from_cart_success_persists_order_and_items(self, user, product):
        """Valida que el servicio transforme exitosamente los ítems activos del carrito en líneas de pedido firmes."""
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(
            cart=cart, product=product, quantity=2, status=CartItem.Status.ACTIVE
        )

        order = OrderService.create_from_cart(
            user=user, address="Plaza Nueva 12", latitude=37.38, longitude=-5.99
        )

        assert Order.objects.count() == 1
        assert OrderItem.objects.filter(order=order).count() == 1

        saved_item = OrderItem.objects.first()
        assert saved_item.product == product
        assert saved_item.quantity == 2
        assert saved_item.price_at_purchase == Decimal("150.00")
        assert order.latitude == 37.38

    def test_create_order_item_mapping(self, user, product):
        """Prueba de unidad para comprobar el correcto mapeo de datos históricos del CartItem al OrderItem."""
        order = Order.objects.create(user=user, address="Dirección Temporal")
        cart = Cart.objects.create(user=user)
        cart_item = CartItem.objects.create(cart=cart, product=product, quantity=3)

        order_item = OrderService._create_order_item(order, cart_item)

        assert order_item.order == order
        assert order_item.product == product
        assert order_item.quantity == 3
        assert order_item.price_at_purchase == product.price

    def test_update_order_status_isolated(self, user):
        """Comprueba de forma unitaria la mutación directa sobre la propiedad de estado de la orden."""
        order = Order.objects.create(
            user=user, address="Calle Sierpes 5", status=Order.Status.PAID
        )

        updated_order = OrderService.update_order_status(order, Order.Status.DELIVERED)

        assert updated_order.status == Order.Status.DELIVERED
        order.refresh_from_db()
        assert order.status == Order.Status.DELIVERED

    def test_create_from_cart_creates_order_successfully_and_leaves_cart_intact(
        self, user, product
    ):
        """Garantiza de forma atómica que el servicio genere el pedido y asocie los productos desde el carrito."""
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(
            cart=cart, product=product, quantity=1, status=CartItem.Status.ACTIVE
        )

        order = OrderService.create_from_cart(user=user, address="Calle Tetuán 4")

        assert Order.objects.filter(user=user).count() == 1
        assert order.address == "Calle Tetuán 4"

        assert (
            CartItem.objects.filter(cart=cart, status=CartItem.Status.ACTIVE).count()
            == 1
        )

    def test_update_order_status_returns_mutated_instance(self, user):
        """El método de actualización debe retornar la misma instancia modificada para encadenamiento lógico."""
        order = Order.objects.create(
            user=user, address="Calle Betis 9", status=Order.Status.PAID
        )
        result = OrderService.update_order_status(order, Order.Status.SHIPPED)

        assert result.id == order.id
        assert result.status == Order.Status.SHIPPED

    def test_order_tracking_code_generation_on_creation(self, user):
        """Prueba unitaria de modelo: Comprueba que el método save() genere automáticamente un código de tracking único al instanciar un pedido."""
        order = Order.objects.create(user=user, address="Vía Roma 2")
        assert order.tracking_code is not None
        assert len(order.tracking_code) > 4


@pytest.mark.django_db
class TestOrdersIntegration:
    """Tests de integración para el modelo Order y sus endpoints a través de la API."""

    def test_create_order_flow(self, api_client, user, product):
        """[Existente] Test del flujo completo: Carrito -> Pago -> Creación de Pedido"""
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
        """[Existente] Test de API que verifica la actualización de estados por el administrador."""
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
        """[Existente] Test de permisos: bloqueo a los pedidos de terceros."""
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
        """[Existente] Test para el filtrado query por tracking_code en el listado administrativo."""
        admin = user
        admin.is_staff = True
        admin.save()

        order = Order.objects.create(user=user, address="Search Test")
        api_client.force_authenticate(user=admin)

        url = f"{reverse('order-list')}?tracking={order.tracking_code}"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["tracking_code"] == order.tracking_code

    def test_admin_can_access_any_order(self, api_client, user):
        """[Existente] Verifica que los administradores superen las barreras de visibilidad de órdenes."""
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
        """[Existente] Asegura que el usuario legítimo acceda a su propia información de seguimiento."""
        order_propia = Order.objects.create(user=user, address="Mi Casa")

        api_client.force_authenticate(user=user)
        url = reverse("order-detail", kwargs={"pk": order_propia.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_user_cannot_access_other_order(self, api_client, user):
        """[Existente] Duplicidad de seguridad del cliente."""
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
