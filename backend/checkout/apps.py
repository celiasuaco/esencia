from django.apps import AppConfig


class CheckoutConfig(AppConfig):
    """Configuración de la aplicación encargada de la gestión del carrito y pasarela de pago."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "checkout"
