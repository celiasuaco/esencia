# order/views.py

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from order.models import Order
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import CartItemSerializer, CartSerializer
from .services import CartService


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


@csrf_exempt
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
        print(f"⚠️ Error de firma Webhook: {e}")  # Mira esto en los logs
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session["metadata"]["order_id"]
        print(f"✅ Pago confirmado para pedido: {order_id}")
        process_payment_success(order_id)

    return HttpResponse(status=200)


def process_payment_success(order_id):

    try:
        order = Order.objects.get(id=order_id)

        if order.status == Order.Status.PAID:
            print(f"Pedido {order_id} ya procesado anteriormente.")
            return

        order.status = Order.Status.PAID
        order.save()
        print(f"Pedido {order_id} marcado como PAGADO.")

        cart = Cart.objects.filter(user=order.user).first()

        if cart:
            active_items = cart.items.filter(status=CartItem.Status.ACTIVE)

            for item in active_items:
                product = item.product
                product.stock -= item.quantity
                product.save()
                print(f"Stock restado: {product.name} (-{item.quantity})")

                item.status = CartItem.Status.CONVERTED
                item.save()

            cart.delete()
            print(f"Carrito de {order.user.email} eliminado tras compra.")
        else:
            print(
                f"No se encontró carrito para el usuario {order.user.email}. Quizás ya fue procesado."
            )

    except Exception as e:
        print(f"ERROR en process_payment_success: {str(e)}")


class CreateCheckoutSessionView(APIView):
    """
    Endpoint que recibe un order_id y devuelve la URL de pago de Stripe.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response(
                {"error": "ID de pedido requerido"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Buscamos el pedido (importar Order de la app order)
            from order.models import Order

            order = Order.objects.get(id=order_id, user=request.user)

            # Generamos la URL usando el servicio que ya tienes
            from .services import StripeService

            checkout_url = StripeService.create_checkout_session(order)

            return Response({"url": checkout_url}, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response(
                {"error": "Pedido no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConfirmPaymentView(APIView):
    def post(self, request):
        session_id = request.data.get("session_id")
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status == "paid":
            order_id = session.metadata.get("order_id")
            process_payment_success(order_id)
            return Response({"status": "success"})

        return Response({"status": "failed"}, status=400)
