from rest_framework import permissions


class IsAdminOrOrderOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # El Admin tiene acceso total
        if request.user.is_staff:
            return True
        # El usuario solo puede ver sus propios pedidos
        return obj.user == request.user
