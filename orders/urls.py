from django.urls import path
from .views import OrderListCreateView, OrderDetailView, OrderStatusUpdateView

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<uuid:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:order_id>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),
]