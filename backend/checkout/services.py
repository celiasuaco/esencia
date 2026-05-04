from decimal import Decimal

import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from product.models import Product
from rest_framework.exceptions import ValidationError

from .models import Cart, CartItem

stripe.api_key = settings.STRIPE_SECRET_KEY


class CartService:
    """Gestor de lógica de negocio para carritos."""

    @staticmethod
    def get_anonymous_cart_data(request):
        """Recupera la estructura del carrito de la sesión del usuario no autenticado."""
        return request.session.get(
            "anon_cart",
            {"items": [], "subtotal": "0.00", "shipping": "4.99", "total": "4.99"},
        )

    @staticmethod
    def get_user_cart(user):
        """Obtiene la instancia de carrito de la base de datos para un usuario específico."""
        return Cart.objects.filter(user=user).first()

    @staticmethod
    def add_item_to_cart(request, product_id, quantity):
        """Añade el producto a la base de datos o a la sesión según el estado de login."""
        product = get_object_or_404(Product, id=product_id)

        if product.stock < quantity:
            raise ValidationError(f"Stock insuficiente para {product.name}.")

        if request.user and request.user.is_authenticated:
            return CartService._add_to_db_cart(request.user, product, quantity)

        return CartService._add_to_session_cart(request, product_id, product, quantity)

    @staticmethod
    def update_item_quantity(request, item_id, quantity):
        """Actualiza la cantidad de un producto, gestionando el stock disponible y convirtiendo el item a 'Abandonado' si la cantidad llega a cero."""
        try:
            val_quantity = int(quantity)
        except (ValueError, TypeError):
            raise ValidationError("La cantidad debe ser un número válido.")

        if request.user.is_authenticated:
            item = get_object_or_404(
                CartItem,
                id=item_id,
                cart__user=request.user,
                status=CartItem.Status.ACTIVE,
            )

            if val_quantity <= 0:
                item.status = CartItem.Status.ABANDONED
                item.save()
                CartService._check_empty_cart_and_delete(item.cart)
                return None

            if item.product.stock < val_quantity:
                raise ValidationError("Stock insuficiente.")

            item.quantity = val_quantity
            item.save()
            return item

        return CartService._update_session_quantity(request, str(item_id), val_quantity)

    @staticmethod
    def _add_to_db_cart(user, product, quantity):
        """Añade un producto al carrito de un usuario autenticado, o actualiza la cantidad si ya existe."""
        cart, _ = Cart.objects.get_or_create(user=user)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            status=CartItem.Status.ACTIVE,
            defaults={"quantity": quantity},
        )

        if not created:
            item.quantity += quantity
            item.save()
        return item

    @staticmethod
    def _add_to_session_cart(request, product_id, product, quantity):
        """Añade un producto al carrito de la sesión para usuarios no autenticados, o actualiza la cantidad si ya existe."""
        cart = CartService.get_anonymous_cart_data(request)
        found = False

        for item in cart["items"]:
            if str(item["product"]) == str(product_id):
                if product.stock < (item["quantity"] + quantity):
                    raise ValidationError("Stock límite alcanzado.")
                item["quantity"] += quantity
                found = True
                break

        if not found:
            cart["items"].append(
                {
                    "product": product_id,
                    "quantity": quantity,
                    "product_details": {
                        "id": product.id,
                        "name": product.name,
                        "price": str(product.price),
                        "photo": product.photo.url if product.photo else None,
                        "material": getattr(product, "material", ""),
                    },
                }
            )

        return CartService._save_session_cart(request, cart)

    @staticmethod
    def _check_empty_cart_and_delete(cart):
        """Verifica si el carrito está vacío (sin items activos) y lo elimina para evitar acumulación de carritos huérfanos."""
        if not cart.items.filter(status=CartItem.Status.ACTIVE).exists():
            cart.delete()
            return True
        return False

    @staticmethod
    def _update_db_quantity(user, item_id, quantity):
        """Actualiza la cantidad de un item en el carrito de un usuario autenticado, gestionando el stock y el estado del item."""
        item = get_object_or_404(
            CartItem, id=item_id, cart__user=user, status=CartItem.Status.ACTIVE
        )

        if quantity <= 0:
            item.status = CartItem.Status.ABANDONED
            item.save()
            return None

        if item.product.stock < quantity:
            raise ValidationError("Stock insuficiente.")

        item.quantity = quantity
        item.save()
        return item

    @staticmethod
    def _update_session_quantity(request, str_item_id, quantity):
        """Actualiza la cantidad de un item en el carrito de la sesión para usuarios no autenticados, gestionando el stock y el estado del item."""
        cart = CartService.get_anonymous_cart_data(request)
        for item in cart["items"]:
            if str(item["product"]) == str_item_id:
                if quantity <= 0:
                    cart["items"].remove(item)
                else:
                    product = get_object_or_404(Product, id=str_item_id)
                    if product.stock < quantity:
                        raise ValidationError("Stock insuficiente.")
                    item["quantity"] = quantity
                break
        return CartService._save_session_cart(request, cart)

    @staticmethod
    def _save_session_cart(request, cart):
        """Guarda la estructura del carrito en la sesión del usuario no autenticado, recalculando los totales."""
        CartService._recalculate_session_cart(cart)
        request.session["anon_cart"] = cart
        request.session.modified = True
        return cart

    @staticmethod
    def remove_item(request, item_id):
        """Elimina un item del carrito, marcándolo como 'Abandonado' para usuarios autenticados o removiéndolo de la sesión para usuarios no autenticados."""
        if request.user.is_authenticated:
            item = get_object_or_404(
                CartItem,
                id=item_id,
                cart__user=request.user,
                status=CartItem.Status.ACTIVE,
            )
            item.status = CartItem.Status.ABANDONED
            item.save()
            CartService._check_empty_cart_and_delete(item.cart)
        else:
            cart = CartService.get_anonymous_cart_data(request)
            cart["items"] = [
                i for i in cart["items"] if str(i["product"]) != str(item_id)
            ]
            CartService._save_session_cart(request, cart)

    @staticmethod
    def _recalculate_session_cart(cart):
        """Recalcula los totales del carrito de la sesión sumando los subtotales de cada item activo y aplicando las reglas de envío."""
        subtotal = sum(
            Decimal(i["product_details"]["price"]) * i["quantity"]
            for i in cart["items"]
        )
        shipping = (
            Decimal("0.00") if (subtotal >= 100 or subtotal == 0) else Decimal("4.99")
        )
        cart["subtotal"] = f"{subtotal:.2f}"
        cart["shipping"] = f"{shipping:.2f}"
        cart["total"] = f"{(subtotal + shipping):.2f}"

    @staticmethod
    def merge_carts(request, user):
        """Sincroniza los productos añadidos de forma anónima con la cuenta del usuario tras iniciar sesión."""
        anon_cart = request.session.get("anon_cart")
        if anon_cart and anon_cart.get("items") and len(anon_cart["items"]) > 0:
            cart, _ = Cart.objects.get_or_create(user=user)

            for item in anon_cart["items"]:
                cart_item, created = CartItem.objects.get_or_create(
                    cart=cart,
                    product_id=item["product"],
                    status=CartItem.Status.ACTIVE,
                    defaults={"quantity": item["quantity"]},
                )
                if not created:
                    cart_item.quantity += item["quantity"]
                    cart_item.save()

            del request.session["anon_cart"]
            request.session.modified = True


class StripeService:
    """Interacción con la API de pagos de Stripe."""

    @staticmethod
    def create_checkout_session(user, cart, address_data):
        """Crea una sesión de pago en Stripe redirigiendo al frontend tras el éxito."""
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "eur",
                            "product_data": {
                                "name": "Compra en Esencia Joyería",
                            },
                            "unit_amount": int(cart.total * 100),
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=f"{settings.FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/cart",
                metadata={
                    "user_id": user.id,
                    "address": address_data.get("address"),
                    "latitude": address_data.get("lat"),
                    "longitude": address_data.get("lng"),
                },
            )
            return checkout_session.url
        except Exception as e:
            return str(e)
