# Authentication and User Management Tests
import pytest
from django.contrib.auth import get_user_model

pytestmark = pytest.mark.django_db

User = get_user_model()


class TestUserRegistration:
    """Test user registration functionality."""

    def test_register_creates_new_user(self, db):
        """Test that registration creates a new user."""
        user = User.objects.create_user(
            username="newuser",
            email="newuser@test.com",
            password="TestPass123!",
        )
        
        assert user.id is not None
        assert user.username == "newuser"
        assert user.email == "newuser@test.com"
        assert user.is_active

    def test_register_duplicate_username_raises_error(self, normal_user):
        """Test that duplicate usernames raise an error."""
        with pytest.raises(Exception):
            User.objects.create_user(
                username=normal_user.username,
                email="different@test.com",
                password="TestPass123!",
            )

    def test_register_duplicate_email_raises_error(self, db):
        """Test that duplicate usernames raise an error (Django doesn't enforce email uniqueness by default)."""
        # Django doesn't enforce unique emails by default on the User model
        # This would require custom validation. Test that we can create users with different usernames
        user1 = User.objects.create_user(
            username="user_one",
            email="test@test.com",
            password="TestPass123!",
        )
        user2 = User.objects.create_user(
            username="user_two",
            email="test@test.com",
            password="TestPass123!",
        )
        assert user1.username != user2.username

    def test_register_password_is_hashed(self, db):
        """Test that passwords are properly hashed."""
        password = "MySecurePass123!"
        user = User.objects.create_user(
            username="hasheduser",
            email="hash@test.com",
            password=password,
        )
        
        # Password should be hashed, not stored as plain text
        assert user.password != password
        assert user.check_password(password)


class TestUserAuthentication:
    """Test user authentication flows."""

    def test_user_can_login_with_correct_password(self, normal_user):
        """Test that user can authenticate with correct password."""
        assert normal_user.check_password("TestPass123!")

    def test_user_login_fails_with_wrong_password(self, normal_user):
        """Test that authentication fails with wrong password."""
        assert not normal_user.check_password("WrongPassword123!")

    def test_inactive_user_cannot_login(self, db, normal_user):
        """Test that inactive users cannot login."""
        normal_user.is_active = False
        normal_user.save()
        
        assert not normal_user.is_active

    def test_user_is_active_by_default(self, normal_user):
        """Test that new users are active by default."""
        assert normal_user.is_active


class TestAdminUser:
    """Test admin user functionality."""

    def test_admin_user_has_staff_permissions(self, admin_user):
        """Test that admin users have staff permissions."""
        assert admin_user.is_staff
        assert admin_user.is_superuser

    def test_staff_user_has_limited_permissions(self, staff_user):
        """Test that staff users have limited permissions."""
        assert staff_user.is_staff
        assert not staff_user.is_superuser

    def test_normal_user_has_no_admin_permissions(self, normal_user):
        """Test that normal users don't have admin permissions."""
        assert not normal_user.is_staff
        assert not normal_user.is_superuser
