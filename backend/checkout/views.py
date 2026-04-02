from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CartItemSerializer, CartSerializer
from .services import CartService


class CartDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = CartService.get_or_create_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class AddToCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        item = CartService.add_item_to_cart(request.user, product_id, quantity)
        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)


class CartItemUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id):
        # Usamos .get() y aseguramos que si viene algo, se trate como entero
        quantity = request.data.get("quantity")

        if quantity is None:
            return Response(
                {"error": "Cantidad requerida"}, status=status.HTTP_400_BAD_REQUEST
            )

        item = CartService.update_item_quantity(request.user, item_id, quantity)
        return Response(status=status.HTTP_200_OK)

    def delete(self, request, item_id):
        CartService.remove_item(request.user, item_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
