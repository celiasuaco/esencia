import logging
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import EmailMultiAlternatives
from django.db.models import Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode

from .emails import send_welcome_email

logger = logging.getLogger("authentication")
User = get_user_model()


def create_user(email, password, full_name=None, **extra_fields):
    """Crea nuevos usuarios, validando duplicados y enviando el correo de bienvenida."""

    logger.info(f"Intentando registrar nuevo usuario: {email}")
    if User.objects.filter(email=email).exists():
        logger.warning(f"Intento de registro fallido: El email {email} ya existe.")
        raise ValidationError("Este email ya está registrado.")

    try:
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            full_name=full_name,
            **extra_fields,
        )
        send_welcome_email(user)
        logger.info(f"Usuario creado con éxito con ID {user.id}: {email}")
        return user
    except Exception as e:
        logger.error(
            f"Error inesperado al crear usuario {email}: {str(e)}", exc_info=True
        )
        raise e


def anonymize_user(user):
    """
    Cumple con el Derecho al Olvido (RGPD).
    Sustituye datos personales por valores genéricos y desactiva la cuenta.
    """
    logger.info(f"Iniciando proceso de anonimización para el usuario con ID {user.id}")

    try:
        random_id = uuid.uuid4().hex[:8]
        user.email = f"deleted_{random_id}@esencia.internal"
        user.username = user.email

        user.full_name = "Usuario Eliminado"
        if hasattr(user, "address"):
            user.address = "Información eliminada"

        if user.photo:
            user.photo.delete(save=False)
            user.photo = None

        user.is_active = False
        user.save()

        logger.info(f"Usuario con ID {user.id} anonimizado correctamente.")
        return user
    except Exception as e:
        logger.error(f"Error al anonimizar usuario {user.id}: {str(e)}")
        raise e


def send_password_reset_email(user):
    """Genera tokens de seguridad y construye el enlace único para el correo de recuperación de contraseña."""

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"

    context = {
        "full_name": user.full_name,
        "reset_url": reset_url,
    }

    html_content = render_to_string("password_reset.html", context)
    text_content = strip_tags(html_content)

    subject = "Restablece tu contraseña - Esencia"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = user.email

    email = EmailMultiAlternatives(subject, text_content, from_email, [to])
    email.attach_alternative(html_content, "text/html")

    try:
        email.send()
        logger.info(f"Correo HTML de recuperación enviado a: {user.email}")
    except Exception as e:
        logger.error(f"Error enviando correo a {user.email}: {str(e)}")
        raise e


def get_users_with_order_stats():
    """Calcula estadísticas del cliente para el panel de administración, como el gasto total o la frecuencia de compra."""

    return (
        User.objects.filter(role=User.Role.CLIENT)
        .annotate(
            orders_count=Count("orders", distinct=True),
            total_spent=Coalesce(
                Sum("orders__total_amount"), Value(0), output_field=DecimalField()
            ),
        )
        .order_by("-total_spent", "-orders_count")
    )
