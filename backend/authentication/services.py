import logging

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

# Instanciamos el logger con el nombre de la app
logger = logging.getLogger("authentication")
User = get_user_model()


def create_user(email, password, full_name=None, **extra_fields):
    logger.info(f"Intentando registrar nuevo usuario: {email}")

    if User.objects.filter(email=email).exists():
        logger.warning(f"Intento de registro fallido: El email {email} ya existe.")
        raise ValidationError("Este email ya está registrado.")

    try:
        user = User.objects.create_user(
            username=email,  # Usamos el email como username
            email=email,
            password=password,
            full_name=full_name,
            **extra_fields,
        )
        logger.info(f"Usuario creado con éxito: ID {user.id} - {email}")
        return user
    except Exception as e:
        logger.error(
            f"Error inesperado al crear usuario {email}: {str(e)}", exc_info=True
        )
        raise e
