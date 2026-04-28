from django.urls import path

from .views import ChatbotView

urlpatterns = [
    path("ask/", ChatbotView.as_view(), name="chatbot-ask"),
    path("admin/ask/", ChatbotView.as_view(), name="chatbot-admin-ask"),
]
