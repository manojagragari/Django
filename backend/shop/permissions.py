from rest_framework.permissions import BasePermission, SAFE_METHODS


class ProductPermission(BasePermission):

    def has_permission(self, request, view):
        role = request.user.role

        # Admin → full access
        if role == "admin":
            return True

        # Manager → only view
        if role == "manager":
            return request.method in SAFE_METHODS

        # Staff → no access to products
        if role == "staff":
            return False

        return False


class SalePermission(BasePermission):

    def has_permission(self, request, view):
        role = request.user.role

        # Admin → full access
        if role == "admin":
            return True

        # Manager → only view
        if role == "manager":
            return request.method in SAFE_METHODS

        # Staff → only create sale
        if role == "staff":
            return request.method == "POST"

        return False