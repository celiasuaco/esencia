from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    """Configuración central de la aplicación de autenticación y usuarios."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "authentication"
