import logging

from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from rest_framework import generics, response, status, views
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .permissions import IsAdminRole
from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserAdminStatsSerializer,
    UserSerializer,
)
from .services import (
    anonymize_user,
    create_user,
    get_users_with_order_stats,
    send_password_reset_email,
)

logger = logging.getLogger("authentication")


class RegisterView(views.APIView):
    """Registro de nuevos clientes con inicio de sesión automático."""

    def post(self, request):
        logger.debug(f"Petición POST recibida en RegisterView. Datos: {request.data}")

        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Errores de validación en registro: {serializer.errors}")
            return response.Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = create_user(**serializer.validated_data)

            refresh = RefreshToken.for_user(user)

            return response.Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "email": user.email,
                        "full_name": user.full_name,
                        "role": user.role,
                        "photo": user.photo.url if user.photo else None,
                    },
                    "message": "Usuario creado exitosamente",
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Error en RegisterView: {str(e)}")
            return response.Response(
                {"error": "No se pudo procesar el registro"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(views.APIView):
    """Autentica al usuario y genera el par de tokens JWT (Access y Refresh)."""

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return response.Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, email=email, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            logger.info(f"Login exitoso para usuario: {email}")
            return response.Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "email": user.email,
                        "full_name": user.full_name,
                        "role": user.role,
                        "photo": user.photo.url if user.photo else None,
                    },
                },
                status=status.HTTP_200_OK,
            )

        logger.warning(f"Intento de login fallido para: {email}")
        return response.Response(
            {"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(views.APIView):
    """Invalida el Refresh Token del usuario para cerrar la sesión de forma segura."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info("Logout exitoso. Token invalidado.")
            return response.Response(
                {"message": "Sesión cerrada correctamente"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error en logout: {str(e)}")
            return response.Response(
                {"error": "Token inválido o expirado"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class DeleteAccountView(views.APIView):
    """
    Endpoint para que el usuario ejerza su Derecho al Olvido.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        try:
            anonymize_user(user)

            logger.info(
                f"El usuario {user.id} ha solicitado y completado su derecho al olvido."
            )
            return response.Response(
                {
                    "message": "Su cuenta y datos personales han sido eliminados de nuestro sistema correctamente."
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            return response.Response(
                {"error": "No se pudo procesar la solicitud de eliminación."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserProfileView(views.APIView):
    """Endpoint para obtener o actualizar la información del perfil del usuario autenticado."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return response.Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return response.Response(serializer.data)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(views.APIView):
    """Inicia el proceso de recuperación de contraseña enviando un email con el token de seguridad."""

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            user = User.objects.filter(email=email).first()
            if user:
                send_password_reset_email(user)
            return response.Response(
                {
                    "message": "Si el correo está registrado, se ha enviado un enlace de recuperación."
                },
                status=status.HTTP_200_OK,
            )
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(views.APIView):
    """Verifica el token y permite al usuario establecer una nueva contraseña de acceso."""

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = urlsafe_base64_decode(
                    serializer.validated_data["uidb64"]
                ).decode()
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None

            if user and default_token_generator.check_token(
                user, serializer.validated_data["token"]
            ):
                user.set_password(serializer.validated_data["new_password"])
                user.save()
                return response.Response(
                    {"message": "Contraseña actualizada con éxito."},
                    status=status.HTTP_200_OK,
                )

            return response.Response(
                {"error": "El enlace es inválido o ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserStatsListView(generics.ListAPIView):
    """Vista para que los administradores analicen el comportamiento de compra de los clientes."""

    permission_classes = [IsAdminRole]
    serializer_class = UserAdminStatsSerializer

    def get_queryset(self):
        return get_users_with_order_stats()
