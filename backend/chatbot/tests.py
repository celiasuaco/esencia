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


@pytest.mark.django_db
class TestChatbotServiceUnit:
    """NUEVOS TESTS UNITARIOS: Aislamiento total de lógica y formateo del modelo de lenguaje."""

    @patch("google.genai.Client")
    def test_chatbot_service_get_response(self, mock_genai_client):
        """[Original] Prueba que el servicio de cliente procesa el catálogo y llama a la IA."""
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

    @patch("google.genai.Client")
    def test_get_catalog_context_filters_only_active_products(self, mock_genai_client):
        """Verifica de forma aislada que el contexto del catálogo inyecte productos activos y omita inactivos."""
        from .services import ChatbotService

        Product.objects.create(
            name="Anillo Esmeralda",
            price=450.00,
            material="Oro 18k",
            is_active=True,
            description="Elegante",
        )
        Product.objects.create(
            name="Collar Antiguo", price=120.00, material="Plata", is_active=False
        )

        service = ChatbotService()
        catalog_context = service._get_catalog_context()

        assert "Anillo Esmeralda" in catalog_context
        assert "450.00" in catalog_context
        assert "Collar Antiguo" not in catalog_context

    @patch("google.genai.Client")
    def test_get_legal_context_returns_static_strings(self, mock_genai_client):
        """Asegura que el marco legal static de la empresa contenga las palabras clave de la política de negocio."""
        from .services import ChatbotService

        service = ChatbotService()
        legal_context = service._get_legal_context()

        assert "TÉRMINOS Y CONDICIONES" in legal_context
        assert "Garantía: 2 años" in legal_context
        assert "100€" in legal_context

    @patch("google.genai.Client")
    def test_chatbot_service_error_handling(self, mock_genai_client):
        """Verifica que si la API de Gemini (Google GenAI) sufre una caída de red o timeout, el servicio capture la excepción y devuelva un mensaje controlado de contingencia."""
        mock_instance = MagicMock()
        mock_genai_client.return_value = mock_instance

        mock_instance.models.generate_content.side_effect = Exception(
            "API Quota Limit o Connection Error"
        )

        from .services import ChatbotService

        service = ChatbotService()
        response = service.get_response("Hola")

        assert "Nuestra esencia está en mantenimiento" in response


@pytest.mark.django_db
class TestChatbotApiIntegration:
    """Tests de integración para evaluar el ciclo de vida de las peticiones HTTP del Chatbot."""

    @patch("chatbot.services.ChatbotService.get_response")
    def test_chatbot_view_success(self, mock_get_response, api_client):
        """[Original] Prueba el endpoint público de chatbot para clientes."""
        mock_get_response.return_value = "Hola desde el Mock"

        url = reverse("chatbot-ask")
        data = {"message": "¿Tienes anillos?"}

        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["response"] == "Hola desde el Mock"

    def test_chatbot_view_missing_message(self, api_client):
        """[Original] Prueba que el endpoint falla si no se envía un mensaje."""
        url = reverse("chatbot-ask")
        response = api_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
