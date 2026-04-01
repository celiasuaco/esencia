from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado:
    - Lectura (GET, HEAD, OPTIONS) permitida para todos.
    - Escritura (POST, PUT, PATCH, DELETE) solo para administradores.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )
