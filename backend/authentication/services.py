import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode

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


def send_password_reset_email(user):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"

    # Contexto para la plantilla
    context = {
        "full_name": user.full_name,
        "reset_url": reset_url,
    }

    # Renderizamos el HTML
    html_content = render_to_string("password_reset.html", context)
    # Creamos una versión en texto plano para los gestores de correo que no admitan HTML
    text_content = strip_tags(html_content)

    subject = "Restablece tu contraseña - Esencia"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = user.email

    # Creamos el objeto de correo
    email = EmailMultiAlternatives(subject, text_content, from_email, [to])
    email.attach_alternative(html_content, "text/html")

    try:
        email.send()
        logger.info(f"Correo HTML de recuperación enviado a: {user.email}")
    except Exception as e:
        logger.error(f"Error enviando correo a {user.email}: {str(e)}")
        raise e
