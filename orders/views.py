from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from .models import Order, OrderItem
from .serializers import OrderReadSerializer, OrderWriteSerializer, ShopOwnerOrderSerializer
from products.models import Shop
import logging
import traceback

logger = logging.getLogger(__name__)


class IsShopOwner(permissions.BasePermission):
    """
    Разрешение для проверки, является ли пользователь владельцем магазина
    """
    def has_permission(self, request, view):
        # Проверяем, что пользователь аутентифицирован
        if not request.user.is_authenticated:
            return False
        
        # Проверяем, что пользователь является владельцем хотя бы одного магазина
        return Shop.objects.filter(owner=request.user).exists()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def shop_orders(request, shop_id):
    """
    Получить заказы для конкретного магазина
    """
    try:
        # Проверяем, что пользователь является владельцем магазина
        shop = get_object_or_404(Shop, id=shop_id)
        
        if shop.owner != request.user:
            return Response(
                {'error': 'You can only view orders for your own shops'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Получаем заказы для этого магазина
        orders = Order.objects.filter(
            orderitem_set__shop_id=shop_id
        ).distinct().prefetch_related('orderitem_set', 'orderitem_set__product', 'user')
        
        serializer = OrderReadSerializer(orders, many=True)
        logger.info(f"User {request.user.email} requested orders for shop {shop_id}. Found {len(serializer.data)} orders.")
        
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting orders for shop {shop_id}: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response(
            {'error': 'Failed to get shop orders'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.AllowAny]  # Разрешаем доступ всем

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user).prefetch_related('orderitem_set__product', 'orderitem_set__shop')
        else:
            return Order.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderWriteSerializer
        return OrderReadSerializer

    def perform_create(self, serializer):
        print(f"Creating order. User: {self.request.user}, Authenticated: {self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            order = serializer.save()
            print(f"Order created successfully: {order.order_id}")
            return order
        else:
            print("User not authenticated, creating order without user")
            order = serializer.save()
            print(f"Order created without user: {order.order_id}")
            return order

    def create(self, request, *args, **kwargs):
        print(f"Create request received. Data: {request.data}")
        print(f"User: {request.user}, Authenticated: {request.user.is_authenticated}")
        
        # Детальное логирование данных
        if 'items' in request.data:
            print(f"Items count: {len(request.data['items'])}")
            for i, item in enumerate(request.data['items']):
                print(f"Item {i+1}: {item}")
        
        try:
            response = super().create(request, *args, **kwargs)
            print(f"✅ Order created successfully: {response.data}")
            return response
        except Exception as e:
            print(f"❌ Error creating order: {e}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            raise

    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({
                "message": "Authentication required to view orders",
                "orders": []
            }, status=status.HTTP_401_UNAUTHORIZED)
        return super().list(request, *args, **kwargs)


class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderReadSerializer
    lookup_field = 'order_id'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('orderitem_set__product', 'orderitem_set__shop')


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.CharField()

class OrderStatusUpdateView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderStatusUpdateSerializer
    queryset = Order.objects.all()
    lookup_field = 'order_id'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        order = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']

        if new_status not in dict(Order.StatusChoices.choices):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save()
        return Response(
            OrderReadSerializer(order, context=self.get_serializer_context()).data,
            status=status.HTTP_200_OK
        )

class OrderUpdateView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderWriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        order = self.get_object()
        
        # Проверяем, что пользователь является владельцем магазина, к которому относится заказ
        shop_ids = order.orderitem_set.values_list('shop_id', flat=True).distinct()
        user_shops = Shop.objects.filter(owner=request.user, id__in=shop_ids)
        
        if not user_shops.exists():
            return Response(
                {'error': 'You can only update orders for your own shops'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Обновляем только статус заказа
        if 'status' in request.data:
            order.status = request.data['status']
            order.save()
            logger.info(f"User {request.user.email} updated order {order.order_id} status to {order.status}")
            
            return Response({
                'message': 'Order status updated successfully',
                'status': order.status
            })
        
        return Response(
            {'error': 'Status field is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class MyShopOrderListCreateAPIView(generics.ListCreateAPIView):
    """
    API для просмотра и создания заказов, связанных с магазинами пользователя.
    Доступно только владельцам магазинов.
    """
    permission_classes = [IsShopOwner]
    serializer_class = ShopOwnerOrderSerializer
    
    def get_queryset(self):
        """
        Возвращает только заказы, связанные с магазинами текущего пользователя
        """
        if not self.request.user.is_authenticated:
            return Order.objects.none()
        
        # Получаем все магазины пользователя
        user_shops = Shop.objects.filter(owner=self.request.user)
        
        # Получаем заказы, которые содержат товары из магазинов пользователя
        return Order.objects.filter(
            orderitem_set__shop__in=user_shops
        ).distinct().prefetch_related(
            'orderitem_set__product', 
            'orderitem_set__shop',
            'user'
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        """
        Возвращает сериализатор в зависимости от метода запроса
        """
        if self.request.method == 'POST':
            return OrderWriteSerializer
        return ShopOwnerOrderSerializer
    
    def perform_create(self, serializer):
        """
        Создание заказа с проверкой прав доступа
        """
        # Проверяем, что пользователь является владельцем магазина
        if not Shop.objects.filter(owner=self.request.user).exists():
            raise serializers.ValidationError("Only shop owners can create orders")
        
        order = serializer.save()
        return order
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        if not queryset.exists():
            return Response({
                "message": "No orders found for your shops",
                "orders": []
            }, status=status.HTTP_200_OK)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": f"Found {queryset.count()} orders for your shops",
            "orders": serializer.data
        }, status=status.HTTP_200_OK) 