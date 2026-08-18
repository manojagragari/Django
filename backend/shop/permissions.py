from rest_framework.permissions import SAFE_METHODS, BasePermission


def is_admin(user):
    """True for superusers and members of the Admin group.

    The lookup is case-insensitive on purpose: databases created before the
    roles were seeded contain lowercase groups ("admin", "staff"), and an exact
    match would silently downgrade those existing users to Staff.
    """
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or user.groups.filter(name__iexact="Admin").exists())
    )


class IsAdminUserGroup(BasePermission):
    """Full access only for superusers and members of the `Admin` group."""

    message = "This action is restricted to Admin users."

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsAdminOrReadOnly(BasePermission):
    message = "This action is restricted to Admin users."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return is_admin(request.user)


class IsStaffOrAdminCanDelete(BasePermission):
    """Any signed-in user may read and write; only Admins may delete.

    Keeps day-to-day shop work open to staff while making destructive actions
    an owner decision.
    """

    message = "Only Admin users can delete records."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method == "DELETE":
            return is_admin(request.user)
        return True
