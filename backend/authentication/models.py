from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrador"
        CLIENT = "CLIENT", "Cliente"

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CLIENT)
    photo = models.ImageField(upload_to="profile_pics/", null=True, blank=True)

    # Configuramos el email como identificador principal
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
