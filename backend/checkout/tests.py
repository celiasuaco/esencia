from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from order.models import Order
from product.models import Product
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from .models import Cart, CartItem
from .services import CartService, StripeService

User = get_user_model()


@pytest.fixture
def api_client():
    """Proporciona el cliente de API de Django Rest Framework para integración."""
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
class TestCartServiceUnit:
    """TESTS UNITARIOS: Aislamiento total de las funciones de lógica y cálculo de carritos."""

    def test_add_item_stock_validation(self, product):
        """Verifica de forma unitaria que no se puede añadir más stock del disponible."""
        request_mock = MagicMock()
        with pytest.raises(ValidationError) as exc:
            CartService.add_item_to_cart(request_mock, product.id, 11)
        assert "Stock insuficiente" in str(exc.value)

    def test_update_quantity_invalid_input(self, user):
        """Valida de forma unitaria que la cantidad debe ser un entero válido."""
        request_mock = MagicMock(user=user)
        with pytest.raises(ValidationError) as exc:
            CartService.update_item_quantity(request_mock, 1, "invalido")
        assert "número válido" in str(exc.value)

    def test_recalculate_session_cart_adds_shipping_below_100(self):
        """Verifica que se aplican los gastos de envío estándar de 4.99€ si el subtotal es menor de 100€."""
        cart = {
            "items": [{"product_details": {"price": "45.00"}, "quantity": 1}],
            "subtotal": "0.00",
            "shipping": "0.00",
            "total": "0.00",
        }
        CartService._recalculate_session_cart(cart)
        assert cart["subtotal"] == "45.00"
        assert cart["shipping"] == "4.99"
        assert cart["total"] == "49.99"

    def test_recalculate_session_cart_free_shipping_above_100(self):
        """Garantiza que el envío premium pase a ser GRATUITO (0.00€) si la compra iguala o supera los 100€."""
        cart = {
            "items": [{"product_details": {"price": "120.00"}, "quantity": 1}],
            "subtotal": "0.00",
            "shipping": "4.99",
            "total": "0.00",
        }
        CartService._recalculate_session_cart(cart)
        assert cart["subtotal"] == "120.00"
        assert cart["shipping"] == "0.00"
        assert cart["total"] == "120.00"

    def test_recalculate_session_cart_empty_is_zero(self):
        """Comprueba que un carrito totalmente vacío en sesión compute gastos de envío a cero."""
        cart = {"items": [], "subtotal": "0.00", "shipping": "4.99", "total": "4.99"}
        CartService._recalculate_session_cart(cart)
        assert cart["subtotal"] == "0.00"
        assert cart["shipping"] == "0.00"
        assert cart["total"] == "0.00"

    def test_check_empty_cart_and_delete_true(self, user):
        """Verifica que el recolector elimina físicamente el modelo de carrito si no quedan líneas activas."""
        cart = Cart.objects.create(user=user)
        is_deleted = CartService._check_empty_cart_and_delete(cart)
        assert is_deleted is True
        assert not Cart.objects.filter(id=cart.id).exists()

    def test_check_empty_cart_and_delete_false(self, user, product):
        """Garantiza que el carrito permanezca intacto si conserva al menos una línea con estado activo."""
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(
            cart=cart, product=product, quantity=1, status=CartItem.Status.ACTIVE
        )
        is_deleted = CartService._check_empty_cart_and_delete(cart)
        assert is_deleted is False
        assert Cart.objects.filter(id=cart.id).exists()

    def test_add_to_db_cart_creates_new_item(self, user, product):
        """Valida la inyección limpia de un nuevo producto en la base de datos relacional."""
        item = CartService._add_to_db_cart(user, product, 2)
        assert item.quantity == 2
        assert item.status == CartItem.Status.ACTIVE
        assert CartItem.objects.filter(cart__user=user).count() == 1

    def test_add_to_db_cart_increments_existing_item(self, user, product):
        """Comprueba que si el artículo ya existía en la bolsa, se incremente su cantidad."""
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(
            cart=cart, product=product, quantity=1, status=CartItem.Status.ACTIVE
        )

        item = CartService._add_to_db_cart(user, product, 3)
        assert item.quantity == 4
        assert CartItem.objects.filter(cart__user=user).count() == 1

    def test_update_db_quantity_to_abandoned_on_zero(self, user, product):
        """Verifica que si la cantidad de un artículo se actualiza a 0, se marque como ABANDONED."""
        cart = Cart.objects.create(user=user)
        item = CartItem.objects.create(
            cart=cart, product=product, quantity=5, status=CartItem.Status.ACTIVE
        )

        result = CartService._update_db_quantity(user, item.id, 0)
        assert result is None
        item.refresh_from_db()
        assert item.status == CartItem.Status.ABANDONED

    def test_update_db_quantity_insufficient_stock_error(self, user, product):
        """El actualizador debe arrojar ValidationError si se solicita más del stock físico actual."""
        cart = Cart.objects.create(user=user)
        item = CartItem.objects.create(
            cart=cart, product=product, quantity=1, status=CartItem.Status.ACTIVE
        )

        with pytest.raises(ValidationError):
            CartService._update_db_quantity(user, item.id, 15)

    def test_get_anonymous_cart_data_default(self):
        """Comprueba que si la sesión no contiene datos, devuelva la estructura inicial por defecto."""
        request_mock = MagicMock()
        request_mock.session = {}
        data = CartService.get_anonymous_cart_data(request_mock)
        assert data["subtotal"] == "0.00"
        assert data["shipping"] == "4.99"
        assert len(data["items"]) == 0

    def test_add_item_to_cart_authenticated_calls_db_logic(self):
        """Verifica que si el usuario está autenticado, se delegue en la base de datos."""
        request_mock = MagicMock()
        request_mock.user.is_authenticated = True
        product_mock = MagicMock(id=1, stock=10)

        with (
            patch("checkout.services.get_object_or_404", return_value=product_mock),
            patch("checkout.services.CartService._add_to_db_cart") as mock_db_add,
        ):
            CartService.add_item_to_cart(request_mock, 1, 2)
            mock_db_add.assert_called_once_with(request_mock.user, product_mock, 2)

    def test_add_item_to_cart_anonymous_calls_session_logic(self):
        """Verifica que si el usuario es anónimo, se delegue en la memoria de sesión."""
        request_mock = MagicMock()
        request_mock.user.is_authenticated = False
        product_mock = MagicMock(id=1, stock=10)

        with (
            patch("checkout.services.get_object_or_404", return_value=product_mock),
            patch(
                "checkout.services.CartService._add_to_session_cart"
            ) as mock_session_add,
        ):
            CartService.add_item_to_cart(request_mock, 1, 2)
            mock_session_add.assert_called_once_with(request_mock, 1, product_mock, 2)

    def test_add_to_session_cart_limit_stock_raises_validation_error(self):
        """La sesión anónima debe lanzar ValidationError si se supera el stock real."""
        request_mock = MagicMock()
        request_mock.session = {
            "anon_cart": {
                "items": [
                    {
                        "product": "1",
                        "quantity": 4,
                        "product_details": {"price": "10.00"},
                    }
                ]
            }
        }
        product_mock = MagicMock(id=1, stock=5)

        with pytest.raises(ValidationError) as exc:
            CartService._add_to_session_cart(request_mock, "1", product_mock, 2)
        assert "Stock límite alcanzado" in str(exc.value)

    def test_update_item_quantity_invalid_type_raises_validation_error(self):
        """Comprueba que el validador unitario de tipos rechace inputs nulos."""
        request_mock = MagicMock()
        with pytest.raises(ValidationError) as exc:
            CartService.update_item_quantity(request_mock, 1, None)
        assert "número válido" in str(exc.value)

    def test_update_session_quantity_removes_item_on_zero(self):
        """Si un usuario anónimo baja la cantidad a cero, se debe remover de la lista."""
        request_mock = MagicMock()
        request_mock.session = {
            "anon_cart": {
                "items": [
                    {
                        "product": "1",
                        "quantity": 3,
                        "product_details": {"price": "10.00"},
                    }
                ],
                "subtotal": "30.00",
                "shipping": "4.99",
                "total": "34.99",
            }
        }
        cart = CartService._update_session_quantity(request_mock, "1", 0)
        assert len(cart["items"]) == 0

    def test_update_session_quantity_insufficient_stock(self):
        """Garantiza que la actualización en sesión anónima respete las restricciones de stock."""
        request_mock = MagicMock()
        request_mock.session = {
            "anon_cart": {
                "items": [
                    {
                        "product": "1",
                        "quantity": 1,
                        "product_details": {"price": "10.00"},
                    }
                ]
            }
        }
        product_mock = MagicMock(id=1, stock=3)

        with patch("checkout.services.get_object_or_404", return_value=product_mock):
            with pytest.raises(ValidationError) as exc:
                CartService._update_session_quantity(request_mock, "1", 5)
            assert "Stock insuficiente" in str(exc.value)

    def test_merge_carts_does_nothing_if_session_empty(self, user):
        """Si la sesión no tiene un carrito huérfano, merge_carts termina sin tocar el ORM."""
        request_mock = MagicMock()
        request_mock.session = {}

        with patch("checkout.models.Cart.objects.get_or_create") as mock_get_or_create:
            CartService.merge_carts(request_mock, user)
            assert not mock_get_or_create.called

    def test_merge_carts_deletes_session_after_success(self, user, product):
        """Comprueba que tras una fusión de ítems exitosa, la sesión se limpie por completo."""
        request_mock = MagicMock()
        request_mock.session = {
            "anon_cart": {"items": [{"product": product.id, "quantity": 2}]}
        }
        CartService.merge_carts(request_mock, user)
        assert "anon_cart" not in request_mock.session


@pytest.mark.django_db
class TestStripeServiceUnit:
    """Tests unitarios dedicados a la pasarela externa de Stripe."""

    @patch("stripe.checkout.Session.create")
    def test_stripe_service_url_generation(self, mock_stripe_create, user, product):
        """Prueba la generación exitosa de URLs de checkout."""
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)
        mock_stripe_create.return_value = MagicMock(
            url="https://checkout.stripe.com/test"
        )

        address_data = {"address": "Calle Mayor", "lat": 1.0, "lng": 1.0}
        url = StripeService.create_checkout_session(user, cart, address_data)

        assert url == "https://checkout.stripe.com/test"
        assert mock_stripe_create.called

    @patch("stripe.checkout.Session.create")
    def test_stripe_service_exception(self, mock_create, user, product):
        """Cubre el bloque try/except cuando Stripe sufre una excepción de conexión."""
        mock_create.side_effect = Exception("Error de conexión")
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)

        url = StripeService.create_checkout_session(user, cart, {})
        assert "Error de conexión" in url


@pytest.mark.django_db
class TestCheckoutIntegration:
    """Tests de integración para los flujos completos de vistas e interacciones HTTP."""

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

    @patch("checkout.views.send_order_confirmation_email")
    def test_process_payment_success_flow(self, mock_email, user, product):
        """Prueba la transformación de Carrito a Pedido persistido."""
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
        """Prueba el endpoint de confirmación manual tras el redirect de Stripe."""
        api_client.force_authenticate(user=user)

        mock_retrieve.return_value = MagicMock(payment_status="paid")
        response = api_client.post(
            reverse("confirm-payment"), {"session_id": "cs_test"}, format="json"
        )

        assert response.status_code == 200
        assert response.data["status"] == "success"
        assert mock_process.called

    def test_confirm_payment_missing_id(self, api_client, user):
        """Error si no se envía session_id en el cuerpo HTTP."""
        api_client.force_authenticate(user=user)
        response = api_client.post(reverse("confirm-payment"), {}, format="json")
        assert response.status_code == 400

    def test_stripe_webhook_invalid_signature(self, api_client):
        """Prueba que el webhook rechaza firmas inválidas o maliciosas."""
        url = reverse("stripe-webhook")
        response = api_client.post(
            url, data=b"payload", content_type="application/json"
        )
        assert response.status_code == 400

    def test_add_item_invalid_quantity_type(self, api_client, product):
        """Testea el error 400 cuando la cantidad no es un formato numérico almacenable."""
        url = reverse("cart-add")
        response = api_client.post(
            url, {"product_id": product.id, "quantity": "muchos"}, format="json"
        )
        assert response.status_code == 400

    def test_update_item_not_found(self, api_client, user):
        """Testea el error 404 al actualizar un ítem inexistente."""
        api_client.force_authenticate(user=user)
        url = reverse("cart-item-update", kwargs={"item_id": 9999})
        response = api_client.patch(url, {"quantity": 5}, format="json")
        assert response.status_code == 404

    def test_update_item_missing_quantity_payload(self, api_client, user):
        """Cubre la validación de la vista cuando falta el campo quantity."""
        api_client.force_authenticate(user=user)
        url = reverse("cart-item-update", kwargs={"item_id": 1})
        response = api_client.patch(url, {}, format="json")
        assert response.status_code == 400

    @patch("checkout.views.send_order_confirmation_email")
    def test_stripe_webhook_success(self, mock_email, api_client, user, product):
        """Simula una notificación exitosa asíncrona de Stripe usando objetos mockeados."""
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
                "data": {"object": mock_session},
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
        """Cubre la rama de eliminación de ítems que no existen en el carrito anónimo."""
        url = reverse("cart-item-update", kwargs={"item_id": 999})
        response = api_client.delete(url)
        assert response.status_code == 204

    def test_cart_detail_authenticated_empty(self, api_client, user):
        """Cubre el retorno del estado por defecto del carrito vacío para usuarios logueados."""
        api_client.force_authenticate(user=user)
        response = api_client.get(reverse("cart-detail"))
        assert response.status_code == 200
        assert response.data["subtotal"] == "0.00"

    @patch("checkout.views.process_payment_success")
    @patch("stripe.checkout.Session.retrieve")
    def test_confirm_payment_failed_status(
        self, mock_retrieve, mock_process, api_client, user
    ):
        """Cubre la rama de error donde el pago no está en estado completado en los servidores de Stripe."""
        api_client.force_authenticate(user=user)
        mock_retrieve.return_value = MagicMock(payment_status="unpaid")

        response = api_client.post(
            reverse("confirm-payment"), {"session_id": "cs_123"}, format="json"
        )
        assert response.status_code == 400
        assert response.data["status"] == "failed"
