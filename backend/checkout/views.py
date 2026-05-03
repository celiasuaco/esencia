import logging

import stripe
from authentication.emails import send_order_confirmation_email
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from order.models import Order, OrderItem
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from checkout.models import Cart, CartItem

from .serializers import CartItemSerializer, CartSerializer
from .services import CartService, StripeService

logger = logging.getLogger("checkout")


class CartDetailView(APIView):
    """Vista para obtener los detalles del carrito, gestionando la persistencia para usuarios autenticados y anónimos."""

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
    """Endpoint para añadir productos a la cesta, validando existencias y estado de autenticación."""

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
    """Gestiona la actualización de cantidades o la eliminación lógica de productos dentro del carrito."""

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
    """Listener de eventos de Stripe para procesar notificaciones asíncronas de pagos completados."""
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        logger.error(f"Error de firma Webhook Stripe: {str(e)}")
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session["metadata"].get("order_id")
        logger.info(f"Webhook: Pago confirmado por Stripe para pedido ID: {order_id}")
        process_payment_success(session)

    return HttpResponse(status=200)


@transaction.atomic
def process_payment_success(session):
    """Transforma el carrito activo en un pedido firme, actualiza el inventario y dispara la confirmación por email."""
    from authentication.models import User

    from checkout.models import CartItem

    try:
        user_id = session.metadata.get("user_id")
        address = session.metadata.get("address")
        lat = session.metadata.get("latitude")
        lng = session.metadata.get("longitude")

        user = User.objects.get(id=user_id)
        cart = Cart.objects.filter(user=user).first()

        if not cart or not cart.items.filter(status=CartItem.Status.ACTIVE).exists():
            logger.warning(
                f"Intento de procesamiento duplicado o carrito vacío para {user.email}."
            )
            return

        active_items = cart.items.filter(status=CartItem.Status.ACTIVE)

        order = Order.objects.create(
            user=user,
            address=address,
            latitude=lat,
            longitude=lng,
            status=Order.Status.PAID,
            is_paid=True,
        )

        for item in active_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                price_at_purchase=item.product.price,
                quantity=item.quantity,
            )

            product = item.product
            product.stock -= item.quantity
            product.save()

            item.status = CartItem.Status.CONVERTED
            item.save()

        order.update_totals()
        send_order_confirmation_email(order)
        cart.delete()

        logger.info(
            f"Pedido {order.tracking_code} generado con éxito tras confirmación de pago."
        )

    except Exception as e:
        logger.error(
            f"Error crítico procesando éxito de pago para usuario {user_id}: {str(e)}"
        )
        raise e


class CreateCheckoutSessionView(APIView):
    """Inicia el flujo de pago redirigiendo al usuario a la pasarela de Stripe con los datos de envío."""

    def post(self, request):
        address_data = request.data.get("address_data")
        if not address_data or not address_data.get("address"):
            return Response({"error": "Datos de dirección incompletos"}, status=400)

        cart = CartService.get_user_cart(request.user)
        if not cart or not cart.items.filter(status=CartItem.Status.ACTIVE).exists():
            return Response({"error": "Carrito vacío"}, status=400)

        url = StripeService.create_checkout_session(request.user, cart, address_data)
        return Response({"url": url}, status=200)


class ConfirmPaymentView(APIView):
    """Endpoint de apoyo para confirmar de forma síncrona el estado de la transacción tras el retorno de Stripe."""

    def post(self, request):
        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"error": "Falta session_id"}, status=400)

        try:
            session = stripe.checkout.Session.retrieve(session_id)

            if session.payment_status == "paid":
                process_payment_success(session)
                return Response({"status": "success"})

            logger.warning(f"Fallido: La sesión {session_id} no tiene estado 'paid'.")
            return Response({"status": "failed"}, status=400)
        except Exception as e:
            logger.error(f"Error recuperando sesión de Stripe {session_id}: {str(e)}")
            return Response({"error": str(e)}, status=500)
