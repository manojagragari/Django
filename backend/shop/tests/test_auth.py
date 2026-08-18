"""Authentication behaviour.

These cover the bug the project shipped with: the frontend treated "a token
string exists in localStorage" as "the user is signed in", and the backend left
every analytics endpoint open because DRF had no default permission class.
"""

from django.contrib.auth.models import Group, User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthFlowTests(APITestCase):
    def setUp(self):
        Group.objects.get_or_create(name="Admin")
        Group.objects.get_or_create(name="Staff")
        self.user = User.objects.create_user(username="shopkeeper", password="Str0ng-Pass!23")
        self.user.groups.add(Group.objects.get(name="Admin"))

    def login(self, username="shopkeeper", password="Str0ng-Pass!23"):
        return self.client.post(
            reverse("auth-login"), {"username": username, "password": password}, format="json"
        )

    def test_login_returns_tokens_and_user_identity(self):
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        # The frontend needs the role to decide what to show; without this it
        # had no idea who was signed in.
        self.assertEqual(response.data["user"]["username"], "shopkeeper")
        self.assertEqual(response.data["user"]["role"], "Admin")
        self.assertTrue(response.data["user"]["is_admin"])

    def test_login_with_wrong_password_is_rejected(self):
        response = self.login(password="not-the-password")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)

    def test_me_requires_a_valid_token(self):
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 401)

    def test_me_returns_the_signed_in_user(self):
        access = self.login().data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get(reverse("auth-me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "shopkeeper")

    def test_garbage_token_is_rejected(self):
        """The old frontend guard would have let this straight into the app."""
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-real-jwt")
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 401)

    def test_refresh_issues_a_new_access_token(self):
        refresh = self.login().data["refresh"]
        response = self.client.post(reverse("auth-refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_logout_blacklists_the_refresh_token(self):
        tokens = self.login().data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        logout = self.client.post(
            reverse("auth-logout"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(logout.status_code, status.HTTP_200_OK)

        # The whole point: the refresh token must be dead server side, not just
        # deleted from the browser.
        self.client.credentials()
        replay = self.client.post(
            reverse("auth-refresh"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(replay.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rotated_refresh_token_invalidates_the_previous_one(self):
        refresh = self.login().data["refresh"]
        rotated = self.client.post(reverse("auth-refresh"), {"refresh": refresh}, format="json")
        self.assertIn("refresh", rotated.data)
        self.assertNotEqual(rotated.data["refresh"], refresh)

        replay = self.client.post(reverse("auth-refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(replay.status_code, status.HTTP_401_UNAUTHORIZED)


class LegacyLowercaseRoleTests(APITestCase):
    """Databases created before the roles were seeded hold lowercase groups.

    The production database has an "admin" group. An exact-match lookup for
    "Admin" silently downgraded those users to Staff, so they could sign in but
    not delete anything.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="manish", password="Str0ng-Pass!23")
        self.user.groups.add(Group.objects.create(name="admin"))

    def test_lowercase_admin_group_is_recognised(self):
        response = self.client.post(
            reverse("auth-login"),
            {"username": "manish", "password": "Str0ng-Pass!23"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["user"]["is_admin"])
        self.assertEqual(response.data["user"]["role"], "Admin")

    def test_lowercase_admin_can_delete(self):
        from shop.models import Category

        category = Category.objects.create(name="Disposable")
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(reverse("category-detail", args=[category.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_superuser_without_any_group_is_admin(self):
        """The production `admin` account is a superuser with no groups."""
        root = User.objects.create_superuser(username="root", password="Str0ng-Pass!23")
        self.client.force_authenticate(user=root)
        response = self.client.get(reverse("auth-me"))
        self.assertTrue(response.data["is_admin"])
        self.assertEqual(response.data["role"], "Admin")


class RegistrationTests(APITestCase):
    def setUp(self):
        Group.objects.get_or_create(name="Staff")

    def test_register_creates_user_with_role_and_returns_tokens(self):
        response = self.client.post(
            reverse("auth-register"),
            {"username": "newstaff", "password": "Str0ng-Pass!23", "group": "Staff"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        user = User.objects.get(username="newstaff")
        self.assertTrue(user.groups.filter(name="Staff").exists())

    def test_duplicate_username_is_rejected(self):
        User.objects.create_user(username="taken", password="Str0ng-Pass!23")
        response = self.client.post(
            reverse("auth-register"),
            {"username": "taken", "password": "Str0ng-Pass!23", "group": "Staff"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_password_is_rejected(self):
        response = self.client.post(
            reverse("auth-register"),
            {"username": "weak", "password": "12345678", "group": "Staff"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_groups_endpoint_is_public_for_the_signup_form(self):
        response = self.client.get(reverse("auth-groups"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Staff", [row["name"] for row in response.data])


class EndpointsAreClosedByDefaultTests(APITestCase):
    """Regression guard for the security hole found in the deployed backend.

    /api/dashboard/ and every /api/analytics/* route answered 200 to anonymous
    callers, publishing the shop's revenue and best sellers to the internet.
    """

    PROTECTED = [
        "analytics-summary",
        "analytics-sales-daily",
        "analytics-sales-weekly",
        "analytics-sales-monthly",
        "analytics-payments",
        "analytics-top-products",
        "analytics-expenses-daily",
        "analytics-expenses-weekly",
        "analytics-profit-trend",
        "product-list",
        "category-list",
        "sale-list",
        "expense-list",
        "ds-catalogue",
    ]

    def test_anonymous_access_is_refused(self):
        for name in self.PROTECTED:
            with self.subTest(endpoint=name):
                response = self.client.get(reverse(name))
                self.assertEqual(
                    response.status_code,
                    status.HTTP_401_UNAUTHORIZED,
                    f"{name} must not be readable without a token",
                )

    def test_legacy_dashboard_alias_is_also_closed(self):
        self.assertEqual(self.client.get("/api/dashboard/").status_code, 401)

    def test_signed_in_user_can_read_analytics(self):
        user = User.objects.create_user(username="staff", password="Str0ng-Pass!23")
        self.client.force_authenticate(user=user)
        for name in self.PROTECTED:
            with self.subTest(endpoint=name):
                self.assertEqual(self.client.get(reverse(name)).status_code, 200)
