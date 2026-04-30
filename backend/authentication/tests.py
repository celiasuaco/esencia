from io import BytesIO

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
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
    """Conjunto de pruebas para el flujo de registro de usuarios y validaciones de modelo."""

    def test_user_model_creation(self):
        """Verifica la creación correcta de un usuario."""
        user = User.objects.create_user(
            username="test@esencia.com",
            email="test@esencia.com",
            password=GOOD_PASSWORD,
        )
        assert user.email == "test@esencia.com"
        assert user.role == "CLIENT"

    def test_create_user_service_success(self):
        """Valida que el servicio de negocio cree correctamente un usuario en la base de datos."""
        user = create_user(
            email="service@test.com", password=GOOD_PASSWORD, full_name="Service User"
        )
        assert User.objects.count() == 1
        assert user.full_name == "Service User"

    def test_create_user_service_duplicate_email(self):
        """Registro inválido de un email que ya existe en el sistema."""
        email = "duplicate@test.com"
        create_user(email=email, password=GOOD_PASSWORD, full_name="Test User")

        with pytest.raises(Exception):
            create_user(email=email, password=OTHER_PASSWORD, full_name="Other User")

    def test_register_api_success(self, client):
        """Prueba de integración del endpoint de registro con datos válidos."""
        url = reverse("register")
        data = {
            "email": "api@test.com",
            "password": GOOD_PASSWORD,
            "full_name": "API User",
        }
        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["message"] == "Usuario creado exitosamente"

    def test_register_api_invalid_password(self, client):
        """Registros incorrectos con contraseñas que no cumplen con el mínimo de longitud."""
        url = reverse("register")
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
    """Pruebas para los flujos de inicio y cierre de sesión mediante JWT."""

    def test_login_success(self, client):
        """Valida que un usuario con credenciales correctas reciba sus tokens de acceso y refresco."""
        email = "login@test.com"
        User.objects.create_user(username=email, email=email, password=GOOD_PASSWORD)

        url = reverse("login")
        data = {"email": email, "password": GOOD_PASSWORD}
        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_logout_success(self):
        """Valida que el cierre de sesión invalide el token de refresco. Requiere autenticación Bearer."""
        from rest_framework.test import APIClient

        api_client = APIClient()

        email = "logout@test.com"
        user = User.objects.create_user(
            username=email, email=email, password=GOOD_PASSWORD
        )
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        url = reverse("logout")
        data = {"refresh": str(refresh)}

        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "Sesión cerrada correctamente"


@pytest.fixture
def auth_client(db):
    """Genera un cliente de API autenticado con un usuario de prueba para testear endpoints protegidos."""
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
    """Pruebas para la visualización y edición de la información de perfil del usuario."""

    def test_get_profile_success(self, auth_client):
        """Verifica que un usuario autenticado pueda recuperar sus propios datos de perfil."""
        client, user = auth_client
        url = reverse("profile")
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email

    def test_update_profile_name_success(self, auth_client):
        """Valida la actualización parcial del nombre completo del usuario a través de un PATCH."""
        client, user = auth_client
        url = reverse("profile")
        data = {"full_name": "Updated Name", "email": user.email}

        response = client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["full_name"] == "Updated Name"

    def test_update_profile_duplicate_email_error(self, auth_client):
        """Comprueba que un usuario no pueda actualizar su email a uno que ya está ocupado por otra cuenta."""
        client, user = auth_client
        User.objects.create_user(
            username="other@test.com", email="other@test.com", password=GOOD_PASSWORD
        )

        url = reverse("profile")
        data = {"email": "other@test.com"}

        response = client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_update_profile_photo_upload(self, auth_client):
        """Prueba la carga y actualización de la imagen de perfil en formato multipart."""
        client, user = auth_client
        url = reverse("profile")

        file_res = BytesIO()
        image = Image.new("RGBA", size=(100, 100), color=(155, 0, 0))
        image.save(file_res, "PNG")
        file_res.seek(0)

        photo = SimpleUploadedFile(
            "test_roses.png", file_res.read(), content_type="image/png"
        )

        data = {"full_name": "User with Photo", "email": user.email, "photo": photo}
        response = client.patch(url, data, format="multipart")

        assert response.status_code == status.HTTP_200_OK
        assert "photo" in response.data
        assert response.data["photo"] is not None
        assert response.data["full_name"] == "User with Photo"


@pytest.mark.django_db
class TestPasswordReset:
    """Conjunto de pruebas para el proceso de recuperación de contraseña por email."""

    def test_send_password_reset_email_logic(self, db):
        """Valida que el servicio genere el correo de recuperación con el contenido HTML esperado."""
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

    def test_password_reset_request_api(self, client):
        """Prueba la solicitud de recuperación mediante API para un email existente."""
        email = "exist@test.com"
        User.objects.create_user(username=email, email=email, password=GOOD_PASSWORD)

        url = reverse("password_reset")
        data = {"email": email}
        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.data
        assert len(mail.outbox) == 1

    def test_password_reset_request_non_existent_email(self, client):
        """Verifica que la solicitud no envíe correos si el email no está registrado (por seguridad responde 200)."""
        url = reverse("password_reset")
        data = {"email": "no-existe@test.com"}
        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_200_OK
        assert len(mail.outbox) == 0

    def test_password_reset_confirm_success(self, client):
        """Valida el cambio efectivo de contraseña usando un token de seguridad y UID válidos."""
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

        user.refresh_from_db()
        assert user.check_password(OTHER_PASSWORD)

    def test_password_reset_confirm_invalid_token(self, client):
        """Comprueba que el sistema rechace el cambio de contraseña si el token de seguridad es falso."""
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
        """Verifica que la nueva contraseña deba cumplir con los requisitos de complejidad (números y letras)."""
        user = User.objects.create_user(
            username="weak@test.com", email="weak@test.com", password=GOOD_PASSWORD
        )
        token = default_token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        url = reverse("password_reset_confirm")
        data = {"uidb64": uidb64, "token": token, "new_password": "solo-letras"}

        response = client.post(url, data, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "new_password" in response.data


class UserStatsAdminTest(TestCase):
    """Pruebas de permisos administrativos para la visualización de estadísticas de clientes."""

    def setUp(self):
        """Configuración del entorno de pruebas con un administrador y un cliente estándar."""
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email="admin@esencia.com",
            password="Pass1234",
            role=User.Role.ADMIN,
            is_staff=True,
            username="admin",
        )
        self.client_user = User.objects.create_user(
            email="client@test.com",
            password="Pass1234",
            role=User.Role.CLIENT,
            username="client",
        )
        self.url = reverse("admin-users")

    def test_admin_can_access_stats(self):
        """Verifica que un usuario con rol ADMIN pueda acceder al listado de estadísticas de clientes."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_client_cannot_access_stats(self):
        """Valida que un cliente estándar tenga prohibido el acceso a datos administrativos."""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
