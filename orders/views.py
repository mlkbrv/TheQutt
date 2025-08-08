from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from .models import Order
from .serializers import OrderReadSerializer, OrderWriteSerializer


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