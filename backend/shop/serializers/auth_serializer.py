from django.contrib.auth.models import Group, User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Roles the shop ships with. `Admin` can delete records; `Staff` cannot.
DEFAULT_GROUPS = ["Admin", "Staff"]


class UserSerializer(serializers.ModelSerializer):
    """Identity payload the frontend stores after login and re-validates on boot."""

    role = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "roles", "is_admin", "date_joined"]

    def get_roles(self, user):
        return list(user.groups.values_list("name", flat=True))

    def get_role(self, user):
        roles = self.get_roles(user)
        if self.get_is_admin(user):
            return "Admin"
        # Title-case so a legacy lowercase group still reads properly in the UI.
        return roles[0].title() if roles else "Staff"

    def get_is_admin(self, user):
        # Case-insensitive: legacy databases hold lowercase group names.
        return user.is_superuser or user.groups.filter(name__iexact="Admin").exists()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    group = serializers.CharField(write_only=True, required=False, default="Staff")

    class Meta:
        model = User
        fields = ["username", "email", "password", "group"]
        extra_kwargs = {"email": {"required": False, "allow_blank": True}}

    def validate_username(self, value):
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("That username is already taken.")
        return username

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_group(self, value):
        name = (value or "Staff").strip() or "Staff"
        # get_or_create rather than a hard failure: a freshly migrated database
        # would otherwise reject every signup until someone opened the admin.
        if name not in DEFAULT_GROUPS and not Group.objects.filter(name=name).exists():
            raise serializers.ValidationError("Choose one of the available roles.")
        return name

    @transaction.atomic
    def create(self, validated_data):
        group_name = validated_data.pop("group", "Staff")
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        group, _ = Group.objects.get_or_create(name=group_name)
        user.groups.add(group)
        return user


class LoginSerializer(TokenObtainPairSerializer):
    """Adds the role to the token and returns the user alongside the tokens."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["is_admin"] = (
            user.is_superuser or user.groups.filter(name__iexact="Admin").exists()
        )
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
