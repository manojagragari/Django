from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from shop.serializers.auth_serializer import (
    DEFAULT_GROUPS,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ -> {access, refresh, user}"""

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class RefreshView(TokenRefreshView):
    """POST /api/auth/refresh/ -> {access, refresh}

    Refresh tokens rotate, so the response carries a brand new refresh token
    and the one that was sent is blacklisted.
    """

    permission_classes = [AllowAny]


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "detail": "Account created successfully.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        },
        status=status.HTTP_201_CREATED,
    )


register_user.throttle_scope = "auth"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Blacklist the supplied refresh token so it cannot be replayed.

    Clearing localStorage alone leaves a valid refresh token in the wild for
    days; this is what actually ends the session server side.
    """
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response(
            {"detail": "A refresh token is required to log out."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        RefreshToken(refresh_token).blacklist()
    except TokenError:
        # Already expired or already blacklisted: the session is over either
        # way, so report success rather than stranding the user in the app.
        pass

    return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """GET /api/auth/me/

    The frontend calls this on every page load. A 401 here is what tells the app
    the stored token is dead and the user must sign in again.
    """
    return Response(UserSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_groups(request):
    names = list(Group.objects.values_list("name", flat=True))
    for fallback in DEFAULT_GROUPS:
        if fallback not in names:
            names.append(fallback)
    return Response([{"name": name} for name in names])
