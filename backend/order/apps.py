# order/apps.py
from django.apps import AppConfig


class OrderConfig(AppConfig):
    """Configuración de la aplicación encargada de gestionar los pedidos."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "order"
