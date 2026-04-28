from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import AdminChatbotService, ChatbotService


class ChatbotView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_message = request.data.get("message")
        if not user_message:
            return Response({"error": "El mensaje es obligatorio"}, status=400)

        service = ChatbotService()
        bot_response = service.get_response(user_message)

        return Response({"response": bot_response})


class AdminChatbotView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        message = request.data.get("message")
        service = AdminChatbotService()
        response = service.get_admin_response(message, request.user)
        return Response({"response": response})
