from django.apps import AppConfig


class ProductConfig(AppConfig):
    """Configuración de la aplicación de productos."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "product"
