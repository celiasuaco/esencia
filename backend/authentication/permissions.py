from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """Permite acceso solo a usuarios con rol ADMIN."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"
