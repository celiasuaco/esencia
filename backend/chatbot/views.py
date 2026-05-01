from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import AdminChatbotService, ChatbotService


class ChatbotView(APIView):
    """Interfaz de comunicación para clientes; procesa consultas sobre el catálogo y términos legales mediante IA."""

    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message")
        if not message:
            return Response(
                {"error": "El mensaje es obligatorio"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = ChatbotService()
        bot_response = service.get_response(message)

        return Response({"response": bot_response})


class AdminChatbotView(APIView):
    """Asistente de inteligencia de negocio para administradores; analiza métricas de ventas y genera predicciones de stock."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        message = request.data.get("message")
        if not message:
            return Response(
                {"error": "El mensaje es obligatorio"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = AdminChatbotService()
        response = service.get_admin_response(message, request.user)

        return Response({"response": response})
