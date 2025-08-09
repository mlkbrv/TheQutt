from django.shortcuts import render
from rest_framework import permissions
from rest_framework.generics import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from users.models import CustomUser
from users.serializers import CustomUserSerializer

from .models import *
from .serializers import ShopSerializer, ShopCreateSerializer, ProductSerializer, ShopWithProductsSerializer, \
    ShopOwnerSerializer
from .permissions import IsAdminOrReadOnly


class ShopOwnersListCreateView(ListCreateAPIView):
    serializer_class = ShopOwnerSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        return CustomUser.objects.filter(shops__isnull=False).distinct()


class ShopListCreateAPIView(ListCreateAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ShopCreateSerializer
        return ShopSerializer

class ShopDetailAPIView(RetrieveAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ShopWithProductsAPIView(RetrieveAPIView):
    queryset = Shop.objects.prefetch_related('product_set')
    serializer_class = ShopWithProductsSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ProductListCreateAPIView(ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ProductDetailAPIView(RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ShopProductsAPIView(ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        shop_id = self.kwargs.get('shop_id')
        return Product.objects.filter(shop_id=shop_id)