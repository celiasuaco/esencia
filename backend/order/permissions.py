from rest_framework import permissions


class IsAdminOrOrderOwner(permissions.BasePermission):
    """Permiso personalizado para que solo los administradores o el propietario del pedido puedan acceder a los pedidos."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.user == request.user
