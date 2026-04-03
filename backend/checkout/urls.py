from django.urls import path

from .views import AddToCartView, CartDetailView, CartItemUpdateView

urlpatterns = [
    path("", CartDetailView.as_view(), name="cart-detail"),
    path("add/", AddToCartView.as_view(), name="cart-add"),
    path("item/<int:item_id>/", CartItemUpdateView.as_view(), name="cart-item-update"),
]
