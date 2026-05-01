from django.urls import path

from .views import AdminChatbotView, ChatbotView

urlpatterns = [
    path("ask/", ChatbotView.as_view(), name="chatbot-ask"),
    path("admin/ask/", AdminChatbotView.as_view(), name="chatbot-admin-ask"),
]
