from django.urls import path

from .views import (
    AddToCartView,
    CartDetailView,
    CartItemUpdateView,
    ConfirmPaymentView,
    CreateCheckoutSessionView,
    stripe_webhook,
)

urlpatterns = [
    path("", CartDetailView.as_view(), name="cart-detail"),
    path("add/", AddToCartView.as_view(), name="cart-add"),
    path("item/<int:item_id>/", CartItemUpdateView.as_view(), name="cart-item-update"),
    path(
        "create-payment-session/",
        CreateCheckoutSessionView.as_view(),
        name="create-payment-session",
    ),
    path("confirm-payment/", ConfirmPaymentView.as_view(), name="confirm-payment"),
    path("webhook/", stripe_webhook, name="stripe-webhook"),
]
