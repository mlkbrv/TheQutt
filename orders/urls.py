from django.urls import path
from .views import (
    OrderListCreateView, 
    OrderDetailView, 
    OrderStatusUpdateView, 
    MyShopOrderListCreateAPIView,
    OrderUpdateView,
    shop_orders
)

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<uuid:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:order_id>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),
    path('<uuid:order_id>/update/', OrderUpdateView.as_view(), name='order-update'),
    path('my-shop/', MyShopOrderListCreateAPIView.as_view(), name='my-shop-orders'),
    path('shop/<int:shop_id>/', MyShopOrderListCreateAPIView.as_view(), name='shop-orders'),
    path('shop-orders/<int:shop_id>/', shop_orders, name='shop-orders-detail'),
    path('user/<int:user_id>/', OrderListCreateView.as_view(), name='user-orders'),
]