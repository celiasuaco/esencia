from rest_framework import permissions


class IsCartOwner(permissions.BasePermission):
    """Verifica que el usuario autenticado sea el propietario del carrito"""

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
