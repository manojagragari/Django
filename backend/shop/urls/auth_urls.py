"""Authentication and identity. Mounted at /api/auth/"""

from django.urls import path

from ..views import auth_views

urlpatterns = [
    path("register/", auth_views.register_user, name="auth-register"),
    path("login/", auth_views.LoginView.as_view(), name="auth-login"),
    path("refresh/", auth_views.RefreshView.as_view(), name="auth-refresh"),
    path("logout/", auth_views.logout_user, name="auth-logout"),
    path("me/", auth_views.current_user, name="auth-me"),
    path("groups/", auth_views.list_groups, name="auth-groups"),
]
