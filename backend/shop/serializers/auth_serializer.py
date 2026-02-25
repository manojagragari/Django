from rest_framework import serializers
from django.contrib.auth.models import User, Group
from django.contrib.auth.password_validation import validate_password
from django.db import transaction


class RegisterSerializer(serializers.ModelSerializer):
    group = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "password", "group"]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        group_name = validated_data.pop("group")
        password = validated_data.pop("password")

        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            raise serializers.ValidationError(
                {"group": "Invalid group selected"}
            )

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        user.groups.add(group)

        return user
