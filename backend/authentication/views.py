import logging

from rest_framework import response, status, views

from .serializers import RegisterSerializer
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
