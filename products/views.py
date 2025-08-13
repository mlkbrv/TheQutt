import logging
from django.shortcuts import render
from rest_framework import permissions
from rest_framework.generics import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from users.models import CustomUser
from users.serializers import CustomUserSerializer

from .models import *
from .serializers import ShopSerializer, ShopCreateSerializer, ProductSerializer, ProductCreateSerializer, ShopWithProductsSerializer, \
    ShopOwnerSerializer
from .permissions import IsAdminOrReadOnly, IsShopOwnerOrReadOnly

import os
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import uuid

logger = logging.getLogger(__name__)

class ShopOwnersListCreateView(ListCreateAPIView):
    serializer_class = ShopOwnerSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        return CustomUser.objects.filter(shops__isnull=False).distinct()


class ShopListCreateAPIView(ListCreateAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ShopCreateSerializer
        return ShopSerializer
    
    def get(self, request, *args, **kwargs):
        logger.info(f"ShopListCreateAPIView.get called by user: {request.user}")
        logger.info(f"Request headers: {request.headers}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request user authenticated: {request.user.is_authenticated}")
        
        response = super().get(request, *args, **kwargs)
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response data count: {len(response.data) if response.data else 0}")
        
        # Детальное логирование данных магазинов
        if response.data:
            logger.info("=== SHOP DETAILS ===")
            for i, shop in enumerate(response.data):
                logger.info(f"Shop {i+1}: ID={shop.get('id')}, Name={shop.get('name')}, Location={shop.get('location')}")
                if shop.get('location'):
                    logger.info(f"  Coordinates: lat={shop['location'].get('latitude')}, lng={shop['location'].get('longitude')}")
                else:
                    logger.info(f"  Location missing")
        
        return response

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

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductSerializer

    def create(self, request, *args, **kwargs):
        # Проверяем, что пользователь является владельцем магазина
        shop_id = request.data.get('shop')
        if shop_id:
            try:
                shop = Shop.objects.get(id=shop_id)
                if shop.owner != request.user:
                    return Response(
                        {'error': 'You can only add products to your own shops'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Shop.DoesNotExist:
                return Response(
                    {'error': 'Shop not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return super().create(request, *args, **kwargs)

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

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_shops(request):
    """
    Получить магазины текущего пользователя
    """
    try:
        user_shops = Shop.objects.filter(owner=request.user)
        serializer = ShopSerializer(user_shops, many=True)
        logger.info(f"User {request.user.email} requested their shops. Found {len(serializer.data)} shops.")
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error getting shops for user {request.user.email}: {e}")
        return Response(
            {'error': 'Failed to get shops'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_product_image(request):
    """
    Загрузить изображение для продукта
    """
    try:
        if 'picture' not in request.FILES:
            return Response(
                {'error': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['picture']
        
        # Проверяем тип файла
        if not image_file.content_type.startswith('image/'):
            return Response(
                {'error': 'File must be an image'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем размер файла (максимум 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Image file too large. Maximum size is 5MB'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Генерируем уникальное имя файла
        file_extension = os.path.splitext(image_file.name)[1]
        file_name = f"product_{uuid.uuid4().hex}{file_extension}"
        
        # Сохраняем файл в папку product_pictures
        file_path = f"product_pictures/{file_name}"
        saved_path = default_storage.save(file_path, ContentFile(image_file.read()))
        
        logger.info(f"User {request.user.email} uploaded product image: {saved_path}")
        
        return Response({
            'message': 'Image uploaded successfully',
            'picture_path': saved_path,
            'file_name': file_name
        })
        
    except Exception as e:
        logger.error(f"Error uploading product image: {e}")
        return Response(
            {'error': 'Failed to upload image'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )