from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CartItemSerializer, CartSerializer
from .services import CartService


class CartDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            cart = CartService.get_or_create_cart(request.user)
            serializer = CartSerializer(cart)
            return Response(serializer.data)
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
