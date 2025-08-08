from django.urls import path
from .views import *

urlpatterns = [
    path('shop-owners/', ShopOwnersListView.as_view(), name='shop-owners-list'),
    path('shops/', ShopListCreateAPIView.as_view(), name='shop-list'),
    path('shops/<int:pk>/', ShopDetailAPIView.as_view(), name='shop-detail'),
    path('shops/<int:pk>/with-products/', ShopWithProductsAPIView.as_view(), name='shop-with-products'),

    path('products/', ProductListCreateAPIView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    
    path('shops/<int:shop_id>/products/', ShopProductsAPIView.as_view(), name='shop-products'),
] 