import re

from django.contrib.auth import authenticate
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


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(
                request=self.context.get("request"), email=email, password=password
            )
            if not user:
                raise serializers.ValidationError(
                    "No se pudo iniciar sesión con las credenciales proporcionadas.",
                    code="authorization",
                )
        else:
            raise serializers.ValidationError(
                "Debe incluir 'email' y 'password'.", code="authorization"
            )

        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "photo"]
        read_only_fields = ["id", "role"]

    def validate_email(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError(
                "Este correo electrónico ya está en uso por otro usuario."
            )
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        if not re.search(r"\d", value) or not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "La contraseña debe contener un número y una mayúscula."
            )
        return value


class UserAdminStatsSerializer(serializers.ModelSerializer):
    orders_count = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, default=0
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "date_joined",
            "role",
            "orders_count",
            "total_spent",
            "photo",
        ]
