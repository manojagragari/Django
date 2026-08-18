from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from shop.serializers.auth_serializer import DEFAULT_GROUPS


class Command(BaseCommand):
    help = "Create the Admin and Staff groups if they are missing."

    def handle(self, *args, **options):
        for name in DEFAULT_GROUPS:
            _, created = Group.objects.get_or_create(name=name)
            verb = "created" if created else "already present"
            self.stdout.write(f"  {name}: {verb}")
        self.stdout.write(self.style.SUCCESS("Roles ready."))
