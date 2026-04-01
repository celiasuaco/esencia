from io import BytesIO

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .services import create_user, send_password_reset_email

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


@pytest.mark.django_db
class TestLoginLogout:
    def test_login_success(self, client):
        # Primero creamos el usuario
        email = "login@test.com"
        User.objects.create_user(username=email, email=email, password=GOOD_PASSWORD)

        url = reverse("login")
        data = {"email": email, "password": GOOD_PASSWORD}
        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_logout_success(self, client):
        email = "logout@test.com"
        user = User.objects.create_user(
            username=email, email=email, password=GOOD_PASSWORD
        )
        refresh = RefreshToken.for_user(user)

        url = reverse("logout")
        data = {"refresh": str(refresh)}
        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_200_OK


@pytest.fixture
def auth_client(db):  # Usamos db para asegurar acceso a base de datos
    """Fixture mejorada con APIClient de DRF"""
    client = APIClient()
    email = "profile@test.com"
    user = User.objects.create_user(
        username=email, email=email, password=GOOD_PASSWORD, full_name="Profile User"
    )
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client, user


@pytest.mark.django_db
class TestUserProfile:
    def test_get_profile_success(self, auth_client):
        client, user = auth_client
        url = reverse("profile")
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email

    def test_update_profile_name_success(self, auth_client):
        client, user = auth_client
        url = reverse("profile")
        # Enviamos el full_name y mantenemos el email actual para evitar conflictos de validación
        data = {"full_name": "Updated Name", "email": user.email}

        response = client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["full_name"] == "Updated Name"

    def test_update_profile_duplicate_email_error(self, auth_client):
        client, user = auth_client
        User.objects.create_user(
            username="other@test.com", email="other@test.com", password=GOOD_PASSWORD
        )

        url = reverse("profile")
        data = {"email": "other@test.com"}

        response = client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # Verificamos que el error sea sobre el email
        assert "email" in response.data

    def test_update_profile_photo_upload(self, auth_client):
        client, user = auth_client
        url = reverse("profile")

        # 1. Preparar la imagen
        file_res = BytesIO()
        image = Image.new("RGBA", size=(100, 100), color=(155, 0, 0))
        image.save(file_res, "PNG")
        file_res.seek(0)

        photo = SimpleUploadedFile(
            "test_roses.png", file_res.read(), content_type="image/png"
        )

        # 2. Datos completos para el PATCH
        # Incluimos el email para evitar el error de validación 400
        data = {"full_name": "User with Photo", "email": user.email, "photo": photo}

        # 3. Ejecutar petición
        response = client.patch(url, data, format="multipart")

        # 4. Aserciones
        assert response.status_code == status.HTTP_200_OK
        assert "photo" in response.data
        assert response.data["photo"] is not None

        # Opcional: Verificar que el nombre también cambió
        assert response.data["full_name"] == "User with Photo"


@pytest.mark.django_db
class TestPasswordReset:
    # --- TESTS DEL SERVICIO (EMAIL) ---
    def test_send_password_reset_email_logic(self, db):
        user = User.objects.create_user(
            username="reset@test.com",
            email="reset@test.com",
            password=GOOD_PASSWORD,
            full_name="Reset User",
        )

        send_password_reset_email(user)

        assert len(mail.outbox) == 1
        assert mail.outbox[0].subject == "Restablece tu contraseña - Esencia"
        assert user.email in mail.outbox[0].to

        html_body = mail.outbox[0].alternatives[0][0]
        assert "Esencia Joyería" in html_body
        assert "Restablecer" in html_body

    # --- TESTS DE LA VISTA: SOLICITUD ---
    def test_password_reset_request_api(self, client):
        email = "exist@test.com"
        User.objects.create_user(username=email, email=email, password=GOOD_PASSWORD)

        url = reverse("password_reset")
        data = {"email": email}
        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.data
        assert len(mail.outbox) == 1

    def test_password_reset_request_non_existent_email(self, client):
        url = reverse("password_reset")
        data = {"email": "no-existe@test.com"}
        response = client.post(url, data, content_type="application/json")

        # Por seguridad, el sistema debe responder 200 aunque el email no exista
        assert response.status_code == status.HTTP_200_OK
        # Pero no debe enviarse ningún correo
        assert len(mail.outbox) == 0

    # --- TESTS DE LA VISTA: CONFIRMACIÓN ---
    def test_password_reset_confirm_success(self, client):
        # 1. Preparar usuario y token real
        user = User.objects.create_user(
            username="confirm@test.com",
            email="confirm@test.com",
            password=GOOD_PASSWORD,
        )
        token = default_token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        url = reverse("password_reset_confirm")
        data = {"uidb64": uidb64, "token": token, "new_password": OTHER_PASSWORD}

        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "Contraseña actualizada con éxito."

        # Verificar que la contraseña cambió realmente
        user.refresh_from_db()
        assert user.check_password(OTHER_PASSWORD)

    def test_password_reset_confirm_invalid_token(self, client):
        user = User.objects.create_user(
            username="invalid@test.com",
            email="invalid@test.com",
            password=GOOD_PASSWORD,
        )
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        url = reverse("password_reset_confirm")
        data = {
            "uidb64": uidb64,
            "token": "token-falso-123",
            "new_password": OTHER_PASSWORD,
        }

        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_password_reset_confirm_weak_password(self, client):
        user = User.objects.create_user(
            username="weak@test.com", email="weak@test.com", password=GOOD_PASSWORD
        )
        token = default_token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        url = reverse("password_reset_confirm")
        # Password sin mayúsculas ni números
        data = {"uidb64": uidb64, "token": token, "new_password": "solo-letras"}

        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # El error viene de la validación del serializer que definiste
        assert "new_password" in response.data
