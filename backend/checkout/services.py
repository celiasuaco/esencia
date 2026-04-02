from decimal import Decimal

from django.shortcuts import get_object_or_404
from product.models import Product
from rest_framework.exceptions import ValidationError

from .models import Cart, CartItem


class CartService:
    @staticmethod
    def get_anonymous_cart_data(request):
        """
        Recupera el carrito de la sesión. Si no existe, devuelve una estructura inicial.
        Calcula totales para que el frontend reciba siempre el mismo formato.
        """
        cart = request.session.get(
            "anon_cart",
            {"items": [], "subtotal": "0.00", "shipping": "4.99", "total": "4.99"},
        )
        return cart

    @staticmethod
    def get_or_create_cart(user):
        """Mantiene la compatibilidad para obtener el carrito de base de datos."""
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    @staticmethod
    def add_item_to_cart(request, product_id, quantity):
        product = get_object_or_404(Product, id=product_id)

        # Validación de Stock Global
        if product.stock < quantity:
            raise ValidationError(
                f"Stock insuficiente para {product.name}. Disponible: {product.stock}"
            )

        # ESCENARIO A: Usuario Autenticado (Base de Datos)
        if request.user and request.user.is_authenticated:
            cart = CartService.get_or_create_cart(request.user)
            item, created = CartItem.objects.get_or_create(cart=cart, product=product)

            if not created:
                new_quantity = item.quantity + quantity
                if product.stock < new_quantity:
                    raise ValidationError(
                        "No puedes añadir más unidades, stock límite alcanzado."
                    )
                item.quantity = new_quantity
            else:
                item.quantity = quantity

            item.save()
            return item

        # ESCENARIO B: Usuario Anónimo (Sesión de Django)
        else:
            cart = request.session.get("anon_cart", {"items": []})

            # Buscar si el producto ya está en el carrito de la sesión
            found = False
            for item in cart["items"]:
                if item["product"] == product_id:
                    new_qty = item["quantity"] + quantity
                    if product.stock < new_qty:
                        raise ValidationError(
                            "No puedes añadir más unidades, stock límite alcanzado."
                        )
                    item["quantity"] = new_qty
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

            # Recalcular totales en la sesión
            CartService._recalculate_session_cart(cart)
            request.session["anon_cart"] = cart
            request.session.modified = True
            return cart

    # checkout/services.py

    @staticmethod
    def update_item_quantity(request, item_id, quantity):
        try:
            quantity = int(quantity)
            # Aseguramos que el item_id de la URL sea string para comparar con la sesión
            str_item_id = str(item_id)
        except (ValueError, TypeError):
            raise ValidationError("La cantidad debe ser un número válido.")

        if request.user.is_authenticated:
            item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
            # ... resto de la lógica de DB igual ...
        else:
            cart = request.session.get("anon_cart", {"items": []})
            for item in cart["items"]:
                # CORRECCIÓN: Convertimos ambos a str para evitar fallos de tipo
                if str(item["product"]) == str_item_id:
                    if quantity <= 0:
                        cart["items"].remove(item)
                    else:
                        product = get_object_or_404(Product, id=item_id)
                        if product.stock < quantity:
                            raise ValidationError("Stock insuficiente.")
                        item["quantity"] = quantity
                    break

            CartService._recalculate_session_cart(cart)
            request.session["anon_cart"] = cart
            request.session.modified = True
            return cart

    @staticmethod
    def remove_item(request, item_id):
        str_item_id = str(item_id)
        if request.user.is_authenticated:
            item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
            item.delete()
        else:
            cart = request.session.get("anon_cart", {"items": []})
            # CORRECCIÓN: Filtrado robusto con conversión a str
            cart["items"] = [
                i for i in cart["items"] if str(i["product"]) != str_item_id
            ]

            CartService._recalculate_session_cart(cart)
            request.session["anon_cart"] = cart
            request.session.modified = True

    @staticmethod
    def _recalculate_session_cart(cart):
        """Método auxiliar para recalcular totales de sesión."""
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
        """
        Mueve los items del carrito de sesión al carrito de base de datos.
        """
        anon_cart = request.session.get("anon_cart")
        if anon_cart and anon_cart.get("items"):
            for item in anon_cart["items"]:
                CartService.add_item_to_cart(request, item["product"], item["quantity"])

            del request.session["anon_cart"]
            request.session.modified = True
