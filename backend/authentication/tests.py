import pytest
from django.urls import reverse
from rest_framework import status

from .models import User
from .services import create_user

GOOD_PASSWORD = "StroNG-Pa$$w0rd-2026!#"  # NOSONAR
BAD_PASSWORD = "123"  # NOSONAR
OTHER_PASSWORD = "AlthougH-It-Is-A-TeSt-99"  # NOSONAR


@pytest.mark.django_db
class TestRegistration:
    # --- TESTS DEL MODELO ---
    def test_user_model_creation(self):
        user = User.objects.create_user(
            username="test@esencia.com",
            email="test@esencia.com",
            password=GOOD_PASSWORD,
        )
        assert user.email == "test@esencia.com"
        assert user.role == "CLIENT"  # Valor por defecto

    # --- TESTS DEL SERVICIO ---
    def test_create_user_service_success(self):
        user = create_user(
            email="service@test.com", password=GOOD_PASSWORD, full_name="Service User"
        )
        assert User.objects.count() == 1
        assert user.full_name == "Service User"

    def test_create_user_service_duplicate_email(self):
        email = "duplicate@test.com"
        create_user(email=email, password=GOOD_PASSWORD, full_name="Test User")

        with pytest.raises(Exception):
            create_user(email=email, password=OTHER_PASSWORD, full_name="Other User")

    # --- TESTS DE LA VISTA (API) ---
    def test_register_api_success(self, client):
        url = reverse("register")  # Asegúrate de que tu urls.py tenga name='register'
        data = {
            "email": "api@test.com",
            "password": GOOD_PASSWORD,
            "full_name": "API User",
        }
        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["message"] == "Usuario creado exitosamente"

    def test_register_api_invalid_password(self, client):
        url = reverse("register")
        # Contraseña demasiado corta (< 8)
        data = {
            "email": "bad@test.com",
            "password": BAD_PASSWORD,
            "full_name": "Bad User",
        }
        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "password" in response.data
