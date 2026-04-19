# order/views.py

import stripe
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from order.models import Order, OrderItem
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from checkout.models import CartItem

from .serializers import CartItemSerializer, CartSerializer
from .services import CartService, StripeService


class CartDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            CartService.merge_carts(request, request.user)

            cart = CartService.get_user_cart(request.user)

            if cart:
                serializer = CartSerializer(cart)
                return Response(serializer.data)

            return Response(
                {"items": [], "subtotal": "0.00", "shipping": "4.99", "total": "4.99"}
            )

        return Response(CartService.get_anonymous_cart_data(request))


class AddToCartView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        product_id = request.data.get("product_id")
        try:
            quantity = int(request.data.get("quantity", 1))
        except (ValueError, TypeError):
            return Response(
                {"error": "Cantidad inválida"}, status=status.HTTP_400_BAD_REQUEST
            )

        result = CartService.add_item_to_cart(request, product_id, quantity)

        if request.user.is_authenticated:
            return Response(
                CartItemSerializer(result).data, status=status.HTTP_201_CREATED
            )
        return Response(result, status=status.HTTP_201_CREATED)


class CartItemUpdateView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, item_id):
        quantity = request.data.get("quantity")
        if quantity is None:
            return Response(
                {"error": "Cantidad requerida"}, status=status.HTTP_400_BAD_REQUEST
            )

        CartService.update_item_quantity(request, item_id, quantity)
        return Response({"message": "Cantidad actualizada"}, status=status.HTTP_200_OK)

    def delete(self, request, item_id):
        CartService.remove_item(request, item_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


@require_POST
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        print(f"Error de firma Webhook: {e}")
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session["metadata"]["order_id"]
        print(f"Pago confirmado para pedido: {order_id}")
        process_payment_success(order_id)

    return HttpResponse(status=200)


@transaction.atomic
def process_payment_success(session):
    from authentication.models import User

    from checkout.models import Cart, CartItem

    try:
        # 1. Extraer datos de la metadata de Stripe
        user_id = session.metadata.get("user_id")
        address = session.metadata.get("address")
        user = User.objects.get(id=user_id)

        # 2. Obtener el carrito activo
        cart = Cart.objects.filter(user=user).first()
        if not cart:
            return

        active_items = cart.items.filter(status=CartItem.Status.ACTIVE)
        if not active_items.exists():
            return

        # 3. CREAR EL PEDIDO FÍSICO
        order = Order.objects.create(
            user=user, address=address, status=Order.Status.PAID, is_paid=True
        )

        # 4. TRASPASAR ITEMS, RESTAR STOCK Y CONVERTIR
        for item in active_items:
            # Crear item de pedido
            OrderItem.objects.create(
                order=order,
                product=item.product,
                price_at_purchase=item.product.price,
                quantity=item.quantity,
            )

            # Restar Stock
            product = item.product
            product.stock -= item.quantity
            product.save()

            # BI: Marcar como convertido
            item.status = CartItem.Status.CONVERTED
            item.save()

        # 5. ACTUALIZAR TOTALES Y BORRAR CARRITO
        order.update_totals()
        cart.delete()

        print(f"✅ Pedido {order.tracking_code} creado tras confirmación de Stripe.")

    except Exception as e:
        print(f"❌ Error procesando el éxito del pago: {str(e)}")
        raise e


class CreateCheckoutSessionView(APIView):
    def post(self, request):
        address = request.data.get("address")
        if not address:
            return Response({"error": "Dirección requerida"}, status=400)

        cart = CartService.get_user_cart(request.user)
        if not cart or not cart.items.filter(status=CartItem.Status.ACTIVE).exists():
            return Response({"error": "Carrito vacío"}, status=400)

        url = StripeService.create_checkout_session(request.user, cart, address)
        return Response({"url": url}, status=200)


# checkout/views.py


class ConfirmPaymentView(APIView):
    def post(self, request):
        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"error": "Falta session_id"}, status=400)

        try:
            session = stripe.checkout.Session.retrieve(session_id)

            if session.payment_status == "paid":
                process_payment_success(session)
                return Response({"status": "success"})

            return Response({"status": "failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
