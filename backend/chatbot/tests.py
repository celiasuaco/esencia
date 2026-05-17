from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from product.models import Product
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        username="user@test.com",
        email="user@test.com",
        password="password123",
    )


@patch("google.genai.Client")
def test_chatbot_service_get_response(mock_genai_client, db):
    """Prueba que el servicio de cliente procesa el catálogo y llama a la IA."""
    mock_instance = MagicMock()
    mock_genai_client.return_value = mock_instance
    mock_instance.models.generate_content.return_value = MagicMock(
        text="Respuesta simulada"
    )

    from .services import ChatbotService

    Product.objects.create(name="Anillo Oro", price=100, is_active=True)

    service = ChatbotService()
    response = service.get_response("Hola, ¿qué me recomiendas?")

    assert response == "Respuesta simulada"
    assert mock_instance.models.generate_content.called


@pytest.mark.django_db
@patch("chatbot.services.ChatbotService.get_response")
def test_chatbot_view_success(mock_get_response, api_client):
    """Prueba el endpoint público de chatbot para clientes."""
    mock_get_response.return_value = "Hola desde el Mock"

    url = reverse("chatbot-ask")
    data = {"message": "¿Tienes anillos?"}

    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["response"] == "Hola desde el Mock"


@pytest.mark.django_db
def test_chatbot_view_missing_message(api_client):
    """Prueba que el endpoint falla si no se envía un mensaje."""
    url = reverse("chatbot-ask")
    response = api_client.post(url, {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "error" in response.data
