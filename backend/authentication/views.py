import logging

from django.contrib.auth import authenticate
from rest_framework import response, status, views
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer
from .services import create_user

logger = logging.getLogger("authentication")


class RegisterView(views.APIView):
    def post(self, request):
        logger.debug(f"Petición POST recibida en RegisterView. Datos: {request.data}")

        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Errores de validación en registro: {serializer.errors}")
            return response.Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            create_user(**serializer.validated_data)
            return response.Response(
                {"message": "Usuario creado exitosamente"},
                status=status.HTTP_201_CREATED,
            )
        except Exception:
            # El error ya se loguea en el service, aquí solo respondemos
            return response.Response(
                {"error": "No se pudo procesar el registro"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(views.APIView):
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
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()  # Invalida el token en el backend
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


class UserProfileView(views.APIView):
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
