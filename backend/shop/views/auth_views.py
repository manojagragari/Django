from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import Group
from shop.serializers.auth_serializer import RegisterSerializer


# -------------------------
# REGISTER USER
# -------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "User registered successfully",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------
# LIST GROUPS (Public)
# -------------------------
@api_view(["GET"])
@permission_classes([AllowAny])   
def list_groups(request):
    groups = Group.objects.all().values("name")
    return Response(groups, status=status.HTTP_200_OK)
