import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from product.models import Product
from rest_framework import status
from rest_framework.test import APIClient

from .models import Cart, CartItem

User = get_user_model()

# --- FIXTURES DENTRO DEL ARCHIVO ---


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


# --- CLASE DE TESTS ---


@pytest.mark.django_db
class TestCart:
    def test_add_to_cart_success(self, api_client, user, product):
        api_client.force_authenticate(user=user)
        url = reverse("cart-add")
        data = {"product_id": product.id, "quantity": 2}

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert CartItem.objects.count() == 1
        assert CartItem.objects.first().quantity == 2

    def test_add_to_cart_insufficient_stock(self, api_client, user):
        api_client.force_authenticate(user=user)
        # Producto con stock muy bajo
        p_limit = Product.objects.create(
            name="Joyita Única", price=50, stock=1, category="ANILLO"
        )
        url = reverse("cart-add")
        data = {"product_id": p_limit.id, "quantity": 5}

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # Verificamos que el mensaje de error venga del CartService
        assert "Stock insuficiente" in str(response.data)

    def test_shipping_calculation(self, api_client, user):
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)

        # 1. Producto barato (< 100€) -> Envío 4.99
        p_cheap = Product.objects.create(
            name="Caja Regalo", price=20, stock=10, category="OTRO"
        )
        CartItem.objects.create(cart=cart, product=p_cheap, quantity=1)

        response = api_client.get(reverse("cart-detail"))
        assert float(response.data["shipping"]) == 4.99

        # 2. Añadimos cantidad para superar 100€ -> Envío 0
        url_update = reverse(
            "cart-item-update", kwargs={"item_id": cart.items.first().id}
        )
        api_client.patch(url_update, {"quantity": 10})  # 20 * 10 = 200€

        response = api_client.get(reverse("cart-detail"))
        assert float(response.data["shipping"]) == 0.00

    def test_add_existing_product_to_cart(self, api_client, user, product):
        """Cubre la lógica de cuando el item ya existe (created=False)"""
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)

        url = reverse("cart-add")
        # Añadimos 2 más al que ya existía
        response = api_client.post(url, {"product_id": product.id, "quantity": 2})

        assert response.status_code == status.HTTP_201_CREATED
        assert CartItem.objects.get(product=product).quantity == 3

    def test_add_existing_product_limit_reached(self, api_client, user, product):
        """Cubre el error de ValidationError cuando el acumulado supera el stock"""
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)
        # Stock es 10. Tenemos 8. Intentamos añadir 3.
        CartItem.objects.create(cart=cart, product=product, quantity=8)

        url = reverse("cart-add")
        response = api_client.post(url, {"product_id": product.id, "quantity": 3})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "stock límite alcanzado" in str(response.data)

    def test_update_quantity_invalid_type(self, api_client, user, product):
        """Cubre el bloque try/except de quantity en update_item_quantity"""
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)
        item = CartItem.objects.create(cart=cart, product=product, quantity=1)

        url = reverse("cart-item-update", kwargs={"item_id": item.id})
        response = api_client.patch(url, {"quantity": "no-soy-un-numero"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "número válido" in str(response.data)

    def test_update_quantity_delete_on_zero(self, api_client, user, product):
        """Cubre la rama if quantity <= 0: item.delete()"""
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)
        item = CartItem.objects.create(cart=cart, product=product, quantity=5)

        url = reverse("cart-item-update", kwargs={"item_id": item.id})
        response = api_client.patch(url, {"quantity": 0})

        assert response.status_code == status.HTTP_200_OK
        assert CartItem.objects.count() == 0

    def test_remove_item_success(self, api_client, user, product):
        """Cubre el método remove_item del service y el DELETE de la view"""
        api_client.force_authenticate(user=user)
        cart = Cart.objects.create(user=user)
        item = CartItem.objects.create(cart=cart, product=product, quantity=1)

        url = reverse("cart-item-update", kwargs={"item_id": item.id})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert CartItem.objects.count() == 0

    def test_cart_permissions(self, api_client, user, product):
        """Cubre permissions.py (IsCartOwner) intentando acceder al carrito de otro"""
        otro_usuario = User.objects.create_user(username="otro", password="123")
        cart_ajeno = Cart.objects.create(user=otro_usuario)
        item_ajeno = CartItem.objects.create(
            cart=cart_ajeno, product=product, quantity=1
        )

        api_client.force_authenticate(
            user=user
        )  # Autenticado como 'user', no como 'otro'

        url = reverse("cart-item-update", kwargs={"item_id": item_ajeno.id})
        response = api_client.delete(url)

        # Debe dar 404 porque el get_object_or_404 filtra por cart__user=user
        assert response.status_code == status.HTTP_404_NOT_FOUND
