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
    # --- TESTS PARA USUARIOS ANÓNIMOS (SESIÓN) ---

    def test_add_to_cart_anonymous(self, api_client, product):
        """Verifica que un usuario no logueado puede añadir al carrito vía sesión"""
        url = reverse("cart-add")
        data = {"product_id": product.id, "quantity": 1}

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert int(response.data["items"][0]["product"]) == product.id
        assert CartItem.objects.count() == 0

    def test_update_quantity_anonymous(self, api_client, product):
        """Verifica que un anónimo puede actualizar cantidad usando el ID del producto"""
        # 1. Añadimos producto
        api_client.post(reverse("cart-add"), {"product_id": product.id, "quantity": 1})

        # 2. Actualizamos (en sesión el item_id es el id del producto)
        url = reverse("cart-item-update", kwargs={"item_id": product.id})
        response = api_client.patch(url, {"quantity": 5})

        assert response.status_code == status.HTTP_200_OK

        # 3. Verificamos en el detalle
        detail = api_client.get(reverse("cart-detail"))
        assert detail.data["items"][0]["quantity"] == 5

    def test_remove_item_anonymous(self, api_client, product):
        """Verifica que un anónimo puede eliminar un producto de su sesión"""
        api_client.post(reverse("cart-add"), {"product_id": product.id, "quantity": 1})

        url = reverse("cart-item-update", kwargs={"item_id": product.id})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        detail = api_client.get(reverse("cart-detail"))
        assert len(detail.data["items"]) == 0

    # --- TESTS PARA USUARIOS AUTENTICADOS (BASE DE DATOS) ---

    def test_add_to_cart_authenticated(self, api_client, user, product):
        api_client.force_authenticate(user=user)
        url = reverse("cart-add")
        data = {"product_id": product.id, "quantity": 2}

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert CartItem.objects.count() == 1
        assert CartItem.objects.first().quantity == 2

    def test_add_to_cart_insufficient_stock(self, api_client, user):
        api_client.force_authenticate(user=user)
        p_limit = Product.objects.create(
            name="Joyita Única", price=50, stock=1, category="ANILLO"
        )
        url = reverse("cart-add")
        data = {"product_id": p_limit.id, "quantity": 5}

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Stock insuficiente" in str(response.data)

    def test_shipping_calculation(self, api_client, user):
        """
        Test definitivo: Verifica el cambio de gastos de envío (4.99 -> 0.00)
        añadiendo productos secuencialmente a través de la API.
        """

        api_client.force_authenticate(user=user)

        # 1. Creamos un producto de 20€
        p_cheap = Product.objects.create(
            name="Joyita Test", price=Decimal("20.00"), stock=50, category="ANILLO"
        )

        api_client.post(reverse("cart-add"), {"product_id": p_cheap.id, "quantity": 1})

        # 3. Verificamos que el envío es 4.99
        res1 = api_client.get(reverse("cart-detail"))
        assert float(res1.data["shipping"]) == 4.99, (
            "El envío debería costar 4.99 para un pedido de 20€"
        )

        # 4. Añadimos más cantidad del mismo producto
        api_client.post(reverse("cart-add"), {"product_id": p_cheap.id, "quantity": 5})

        res2 = api_client.get(reverse("cart-detail"))

        print(
            f"DEBUG: Subtotal: {res2.data['subtotal']}, Shipping: {res2.data['shipping']}"
        )

        assert float(res2.data["shipping"]) == 0.00, (
            f"El envío debería ser GRATIS para {res2.data['subtotal']}€"
        )

    def test_remove_item_authenticated(self, api_client, user, product):
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)
        item = CartItem.objects.create(cart=cart, product=product, quantity=1)

        url = reverse("cart-item-update", kwargs={"item_id": item.id})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert CartItem.objects.count() == 0

    def test_cart_permissions_prevent_access_to_others(self, api_client, user, product):
        """Un usuario logueado no puede borrar items de la DB de otro usuario"""
        otro_usuario = User.objects.create_user(username="otro", password="123")
        cart_ajeno = Cart.objects.create(user=otro_usuario)
        item_ajeno = CartItem.objects.create(
            cart=cart_ajeno, product=product, quantity=1
        )

        api_client.force_authenticate(user=user)
        url = reverse("cart-item-update", kwargs={"item_id": item_ajeno.id})

        # Debe dar 404 porque el get_object_or_404 del service busca por cart__user=user
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    # --- TEST DE FUSIÓN (MERGE) ---

    def test_merge_cart_on_login_logic(self, api_client, user, product):
        from django.contrib.sessions.middleware import SessionMiddleware
        from django.test import RequestFactory

        from .services import CartService

        factory = RequestFactory()
        request = factory.get("/")
        request.user = user

        middleware = SessionMiddleware(lambda r: None)
        middleware.process_request(request)
        request.session.save()

        # Añadir item como anónimo
        CartService.add_item_to_cart(request, product.id, 2)

        # Ejecutar merge
        CartService.merge_carts(request, user)

        # Verificar
        assert CartItem.objects.filter(cart__user=user, product=product).exists()
        assert CartItem.objects.get(product=product).quantity == 2
        assert "anon_cart" not in request.session
