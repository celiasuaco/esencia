from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """Permite acceso solo a usuarios con rol de ADMIN."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )
