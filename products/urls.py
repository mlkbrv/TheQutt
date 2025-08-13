from django.urls import path
from .views import (
    ShopListCreateAPIView, ShopDetailAPIView, ShopWithProductsAPIView,
    ProductListCreateAPIView, ProductDetailAPIView, ShopProductsAPIView,
    ShopOwnersListCreateView, my_shops, upload_product_image
)

urlpatterns = [
    path('shops/', ShopListCreateAPIView.as_view(), name='shop-list-create'),
    path('shops/<int:pk>/', ShopDetailAPIView.as_view(), name='shop-detail'),
    path('shops/<int:shop_id>/products/', ShopProductsAPIView.as_view(), name='shop-products'),
    path('shops/<int:pk>/with-products/', ShopWithProductsAPIView.as_view(), name='shop-with-products'),
    path('products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('shop-owners/', ShopOwnersListCreateView.as_view(), name='shop-owners'),
    path('my-shops/', my_shops, name='my-shops'),
    path('upload-image/', upload_product_image, name='upload-product-image'),
] 