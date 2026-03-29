import re

from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, min_length=8, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = ["email", "password", "full_name"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un usuario con este correo ya existe.")
        return value

    def validate_password(self, value):
        # Al menos un número
        if not re.search(r"\d", value):
            raise serializers.ValidationError(
                "La contraseña debe contener al menos un número."
            )
        # Al menos una mayúscula
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "La contraseña debe contener al menos una letra mayúscula."
            )
        return value
