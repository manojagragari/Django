"""Create the Admin and Staff groups.

Registration asks the user to pick a role. Seeding the groups here means a
freshly migrated database can accept signups immediately, instead of rejecting
every one until somebody creates the groups by hand in the Django admin.
"""

from django.db import migrations

ROLES = ["Admin", "Staff"]


def create_roles(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    for name in ROLES:
        Group.objects.get_or_create(name=name)


def remove_roles(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name__in=ROLES).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0003_restructure_v2"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RunPython(create_roles, remove_roles),
    ]
