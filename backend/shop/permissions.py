from rest_framework.permissions import BasePermission, SAFE_METHODS


class ProductPermission(BasePermission):

    def has_permission(self, request, view):
        role = getattr(request.user, "role", None)

        if role == "admin":
            return True

        if role == "manager":
            return request.method in SAFE_METHODS

        if role == "staff":
            return False

        return False


class SalePermission(BasePermission):

    def has_permission(self, request, view):
        role = getattr(request.user, "role", None)

        if role == "admin":
            return True

        if role == "manager":
            return request.method in SAFE_METHODS

        if role == "staff":
            return request.method == "POST"

        return False