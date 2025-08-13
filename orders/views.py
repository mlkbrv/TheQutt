from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from .models import Order
from .serializers import OrderReadSerializer, OrderWriteSerializer, ShopOwnerOrderSerializer
from products.models import Shop


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
        return super().create(request, *args, **kwargs)

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