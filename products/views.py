from django.shortcuts import render
from rest_framework import permissions
from rest_framework.generics import *
from .models import *
from .serializers import ShopSerializer, ProductSerializer, ShopWithProductsSerializer


class ShopListAPIView(ListAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, )

class ShopDetailAPIView(RetrieveAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, )

class ShopWithProductsAPIView(RetrieveAPIView):
    queryset = Shop.objects.prefetch_related('product_set')
    serializer_class = ShopWithProductsSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, )

class ProductListAPIView(ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, )

class ProductDetailAPIView(RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, )

class ShopProductsAPIView(ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, )
    
    def get_queryset(self):
        shop_id = self.kwargs.get('shop_id')
        return Product.objects.filter(shop_id=shop_id)