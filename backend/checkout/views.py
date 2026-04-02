from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CartItemSerializer, CartSerializer
from .services import CartService


class CartDetailView(APIView):
    # Permitimos acceso a anónimos para que vean su carrito de sesión
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            # Flujo para usuario logueado: Base de Datos
            cart = CartService.get_or_create_cart(request.user)
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        else:
            # Flujo para usuario invitado: Sesión
            cart_data = CartService.get_anonymous_cart_data(request)
            return Response(cart_data)


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

        # Pasamos el request completo al servicio
        result = CartService.add_item_to_cart(request, product_id, quantity)

        if request.user.is_authenticated:
            # Si está logueado, result es un objeto CartItem, usamos el Serializer
            return Response(
                CartItemSerializer(result).data, status=status.HTTP_201_CREATED
            )
        else:
            # Si es anónimo, result es el diccionario de la sesión
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
