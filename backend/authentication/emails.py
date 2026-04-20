# authentication/emails.py
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger("authentication")


def send_custom_email(subject, to_email, template_name, context):
    """Función base para envío de correos HTML."""
    try:
        html_content = render_to_string(template_name, context)
        text_content = strip_tags(html_content)
        from_email = settings.DEFAULT_FROM_EMAIL

        email = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
        email.attach_alternative(html_content, "text/html")
        email.send()
        logger.info(f"✅ Correo '{subject}' enviado con éxito a {to_email}")
    except Exception as e:
        logger.error(f"❌ Error enviando correo '{subject}' a {to_email}: {str(e)}")


def send_welcome_email(user):
    context = {"full_name": user.full_name or user.email}
    send_custom_email(
        "¡Bienvenida a Esencia Joyería!",
        user.email,
        "welcome.html",
        context,
    )


def send_order_confirmation_email(order):
    context = {"order": order, "user": order.user}
    # Ruta ajustada
    send_custom_email(
        f"Confirmación de tu pedido #{order.tracking_code}",
        order.user.email,
        "order_confirmation.html",
        context,
    )


def send_order_status_update_email(order):
    context = {"order": order, "status_display": order.get_status_display()}
    # Ruta ajustada
    send_custom_email(
        f"Actualización de tu pedido #{order.tracking_code}",
        order.user.email,
        "order_status_update.html",
        context,
    )
