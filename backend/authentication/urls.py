from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from authentication.views import (
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    UserProfileView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path(
        "password-reset-confirm/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
]
