from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from order.models import Order
from product.models import Product
from rest_framework.test import APIClient

from .models import Cart, CartItem
from .services import CartService, StripeService

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser@esencia.com",
        password="password123",
        email="testuser@esencia.com",
    )


@pytest.fixture
def product(db):
    return Product.objects.create(
        name="Anillo Esencia",
        price=Decimal("150.00"),
        stock=10,
        category="ANILLO",
        is_active=True,
    )


@pytest.mark.django_db
class TestCheckoutModule:
    """Tests unitarios y de integración para el módulo de Checkout."""

    def test_add_item_stock_validation(self, api_client, product):
        """Verifica que no se puede añadir más stock del disponible."""
        with pytest.raises(Exception) as exc:
            CartService.add_item_to_cart(api_client, product.id, 11)
        assert "Stock insuficiente" in str(exc.value)

    def test_update_quantity_invalid_input(self, api_client, user, product):
        """Valida que la cantidad debe ser un entero."""
        api_client.force_authenticate(user=user)
        with pytest.raises(Exception) as exc:
            CartService.update_item_quantity(api_client, 1, "invalido")
        assert "número válido" in str(exc.value)

    def test_anonymous_cart_session_flow(self, api_client, product):
        """Prueba completa del ciclo de vida del carrito en sesión (Anónimo)."""
        url_add = reverse("cart-add")
        api_client.post(url_add, {"product_id": product.id, "quantity": 1})

        response = api_client.get(reverse("cart-detail"))
        assert response.status_code == 200
        assert len(response.data["items"]) == 1
        assert response.data["total"] == "150.00"

        url_update = reverse("cart-item-update", kwargs={"item_id": product.id})
        api_client.patch(url_update, {"quantity": 2}, format="json")

        response = api_client.get(reverse("cart-detail"))
        assert response.data["items"][0]["quantity"] == 2

        api_client.delete(url_update)
        response = api_client.get(reverse("cart-detail"))
        assert len(response.data["items"]) == 0

    def test_merge_carts_logic(self, api_client, user, product):
        """Verifica que los items anónimos se pasan al usuario al loguearse."""
        api_client.post(reverse("cart-add"), {"product_id": product.id, "quantity": 1})

        api_client.force_authenticate(user=user)
        api_client.get(reverse("cart-detail"))

        assert CartItem.objects.filter(cart__user=user, product=product).exists()

    def test_cart_item_delete_authenticated(self, api_client, user, product):
        """Verifica el borrado lógico (ABANDONED) para usuarios autenticados."""
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)
        item = CartItem.objects.create(cart=cart, product=product, quantity=1)

        url = reverse("cart-item-update", kwargs={"item_id": item.id})
        response = api_client.delete(url)

        assert response.status_code == 204
        item.refresh_from_db()
        assert item.status == CartItem.Status.ABANDONED

    def test_create_checkout_session_empty_cart_error(self, api_client, user):
        """Error al intentar pagar con carrito vacío."""
        api_client.force_authenticate(user=user)
        response = api_client.post(
            reverse("create-payment-session"),
            {"address_data": {"address": "Test 123"}},
            format="json",
        )
        assert response.status_code == 400
        assert response.data["error"] == "Carrito vacío"

    @patch("stripe.checkout.Session.create")
    def test_stripe_service_url_generation(self, mock_stripe_create, user, product):
        """Prueba unitaria del servicio de Stripe."""
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)
        mock_stripe_create.return_value = MagicMock(
            url="https://checkout.stripe.com/test"
        )

        address_data = {"address": "Calle Mayor", "lat": 1.0, "lng": 1.0}
        url = StripeService.create_checkout_session(user, cart, address_data)

        assert url == "https://checkout.stripe.com/test"
        assert mock_stripe_create.called

    @patch("checkout.views.send_order_confirmation_email")
    def test_process_payment_success_flow(self, mock_email, user, product):
        """Prueba la transformación de Carrito -> Pedido."""
        from checkout.views import process_payment_success

        cart = Cart.objects.create(user=user)
        CartItem.objects.create(
            cart=cart, product=product, quantity=2, status=CartItem.Status.ACTIVE
        )

        mock_session = MagicMock()
        mock_session.metadata = {
            "user_id": user.id,
            "address": "Dirección Test",
            "latitude": "40.41",
            "longitude": "-3.70",
        }

        process_payment_success(mock_session)

        order = Order.objects.get(user=user)
        assert order.address == "Dirección Test"
        product.refresh_from_db()
        assert product.stock == 8
        assert not Cart.objects.filter(user=user).exists()
        assert mock_email.called

    @patch("stripe.checkout.Session.retrieve")
    @patch("checkout.views.process_payment_success")
    def test_confirm_payment_view(self, mock_process, mock_retrieve, api_client, user):
        """Prueba el endpoint de confirmación manual tras el redirect."""
        api_client.force_authenticate(user=user)

        mock_retrieve.return_value = MagicMock(payment_status="paid")
        response = api_client.post(
            reverse("confirm-payment"), {"session_id": "cs_test"}, format="json"
        )

        assert response.status_code == 200
        assert response.data["status"] == "success"
        assert mock_process.called

    def test_confirm_payment_missing_id(self, api_client, user):
        """Error si no se envía session_id."""
        api_client.force_authenticate(user=user)
        response = api_client.post(reverse("confirm-payment"), {}, format="json")
        assert response.status_code == 400

    def test_stripe_webhook_invalid_signature(self, api_client):
        """Prueba que el webhook rechaza firmas inválidas."""
        url = reverse("stripe-webhook")
        response = api_client.post(
            url, data=b"payload", content_type="application/json"
        )
        assert response.status_code == 400

    def test_add_item_invalid_quantity_type(self, api_client, product):
        """Testea el error cuando la cantidad no es almacenable."""
        url = reverse("cart-add")
        response = api_client.post(
            url, {"product_id": product.id, "quantity": "muchos"}, format="json"
        )
        assert response.status_code == 400

    def test_update_item_not_found(self, api_client, user):
        """Testea el error 404 al actualizar un item que no existe."""
        api_client.force_authenticate(user=user)
        url = reverse("cart-item-update", kwargs={"item_id": 9999})
        response = api_client.patch(url, {"quantity": 5}, format="json")
        assert response.status_code == 404

    def test_update_item_missing_quantity_payload(self, api_client, user):
        """Cubre la rama de validación de la vista cuando falta el campo quantity."""
        api_client.force_authenticate(user=user)
        url = reverse("cart-item-update", kwargs={"item_id": 1})
        response = api_client.patch(url, {}, format="json")
        assert response.status_code == 400

    @patch("checkout.views.send_order_confirmation_email")
    def test_stripe_webhook_success(self, mock_email, api_client, user, product):
        """Simula una notificación exitosa de Stripe usando objetos mockeados."""
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)

        mock_session = MagicMock()
        mock_session.metadata = {
            "user_id": str(user.id),
            "address": "Calle Test",
            "latitude": "0.0",
            "longitude": "0.0",
        }

        with patch("stripe.Webhook.construct_event") as mock_webhook:
            mock_webhook.return_value = {
                "type": "checkout.session.completed",
                "data": {"object": mock_session},  # Pasamos el objeto con .metadata
            }

            url = reverse("stripe-webhook")
            response = api_client.post(
                url, data={}, HTTP_STRIPE_SIGNATURE="t=123,v1=123"
            )

            assert response.status_code == 200
            assert Order.objects.filter(user=user).exists()

    @patch("stripe.checkout.Session.retrieve")
    def test_confirm_payment_view_error_stripe(self, mock_retrieve, api_client, user):
        """Cubre el bloque catch (500) cuando Stripe falla en la recuperación."""
        api_client.force_authenticate(user=user)
        mock_retrieve.side_effect = Exception("Stripe Down")

        response = api_client.post(
            reverse("confirm-payment"), {"session_id": "cs_123"}, format="json"
        )
        assert response.status_code == 500

    def test_remove_non_existent_item_anonymous(self, api_client):
        """Cubre la rama de eliminación de items que no existen en el carrito anónimo."""
        url = reverse("cart-item-update", kwargs={"item_id": 999})
        response = api_client.delete(url)
        assert response.status_code == 204

    def test_cart_detail_authenticated_empty(self, api_client, user):
        """Cubre el return del carrito vacío para usuarios logueados."""
        api_client.force_authenticate(user=user)
        response = api_client.get(reverse("cart-detail"))
        assert response.status_code == 200
        assert response.data["subtotal"] == "0.00"

    @patch("stripe.checkout.Session.create")
    def test_stripe_service_exception(self, mock_create, user, product):
        """Cubre el bloque try/except en StripeService.create_checkout_session."""
        mock_create.side_effect = Exception("Error de conexión")
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)

        url = StripeService.create_checkout_session(user, cart, {})
        assert "Error de conexión" in url

    @patch("checkout.views.process_payment_success")
    @patch("stripe.checkout.Session.retrieve")
    def test_confirm_payment_failed_status(
        self, mock_retrieve, mock_process, api_client, user
    ):
        """Cubre la rama donde el pago no está completado en Stripe."""
        api_client.force_authenticate(user=user)
        mock_retrieve.return_value = MagicMock(payment_status="unpaid")

        response = api_client.post(
            reverse("confirm-payment"), {"session_id": "cs_123"}, format="json"
        )
        assert response.status_code == 400
        assert response.data["status"] == "failed"
