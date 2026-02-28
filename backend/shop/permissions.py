from rest_framework.permissions import BasePermission

class IsAdminUserGroup(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return request.user.groups.filter(name="Admin").exists()
    
