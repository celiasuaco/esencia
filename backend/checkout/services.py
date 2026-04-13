from decimal import Decimal

from django.shortcuts import get_object_or_404
from product.models import Product
from rest_framework.exceptions import ValidationError

from .models import Cart, CartItem


class CartService:
    @staticmethod
    def get_anonymous_cart_data(request):
        return request.session.get(
            "anon_cart",
            {"items": [], "subtotal": "0.00", "shipping": "4.99", "total": "4.99"},
        )

    @staticmethod
    def get_or_create_cart(user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    @staticmethod
    def add_item_to_cart(request, product_id, quantity):
        product = get_object_or_404(Product, id=product_id)

        if product.stock < quantity:
            raise ValidationError(f"Stock insuficiente para {product.name}.")

        if request.user and request.user.is_authenticated:
            return CartService._add_to_db_cart(request.user, product, quantity)

        return CartService._add_to_session_cart(request, product_id, product, quantity)

    @staticmethod
    def update_item_quantity(request, item_id, quantity):
        try:
            val_quantity = int(quantity)
        except (ValueError, TypeError):
            raise ValidationError("La cantidad debe ser un número válido.")

        if request.user.is_authenticated:
            return CartService._update_db_quantity(request.user, item_id, val_quantity)

        return CartService._update_session_quantity(request, str(item_id), val_quantity)

    @staticmethod
    def _add_to_db_cart(user, product, quantity):
        cart = CartService.get_or_create_cart(user)
        # Buscamos si ya existe un item ACTIVO para este producto
        item = CartItem.objects.filter(
            cart=cart, product=product, status=CartItem.Status.ACTIVE
        ).first()

        if item:
            if product.stock < (item.quantity + quantity):
                raise ValidationError(
                    "No puedes añadir más unidades, stock límite alcanzado."
                )
            item.quantity += quantity
        else:
            # Si no hay uno activo, creamos uno nuevo (o reutilizamos uno abandonado si prefieres,
            # pero por simplicidad de métricas creamos uno nuevo ACTIVE)
            item = CartItem.objects.create(
                cart=cart, product=product, quantity=quantity
            )

        item.save()
        return item

    @staticmethod
    def _add_to_session_cart(request, product_id, product, quantity):
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
    def _update_db_quantity(user, item_id, quantity):
        # IMPORTANTE: Solo permitimos actualizar items que estén ACTUAMENTE activos
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
        CartService._recalculate_session_cart(cart)
        request.session["anon_cart"] = cart
        request.session.modified = True
        return cart

    @staticmethod
    def remove_item(request, item_id):
        if request.user.is_authenticated:
            item = get_object_or_404(
                CartItem,
                id=item_id,
                cart__user=request.user,
                status=CartItem.Status.ACTIVE,
            )
            item.status = CartItem.Status.ABANDONED
            item.save()
        else:
            cart = CartService.get_anonymous_cart_data(request)
            cart["items"] = [
                i for i in cart["items"] if str(i["product"]) != str(item_id)
            ]
            CartService._save_session_cart(request, cart)

    @staticmethod
    def _recalculate_session_cart(cart):
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
        anon_cart = request.session.get("anon_cart")
        if anon_cart and anon_cart.get("items"):
            for item in anon_cart["items"]:
                CartService.add_item_to_cart(request, item["product"], item["quantity"])
            del request.session["anon_cart"]
            request.session.modified = True
