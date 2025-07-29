from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductSerializer, ShopSerializer
from products.models import *

class OrderItemReadSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    shop = ShopSerializer(read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'shop', 'quantity', 'total_price']

    def get_total_price(self, obj):
        if obj.product and obj.product.price and obj.quantity:
            return obj.product.price * obj.quantity
        return 0

class OrderReadSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True, source='orderitem_set')
    total_sum = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_id',
            'user',
            'created_at',
            'status',
            'status_display',
            'items',
            'total_sum'
        ]
        read_only_fields = ['order_id', 'user', 'created_at']

    def get_total_sum(self, obj):
        total = 0
        for item in obj.orderitem_set.all():
            if item.product and item.product.price and item.quantity:
                total += item.product.price * item.quantity
        return total


class OrderItemWriteSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    shop_id = serializers.PrimaryKeyRelatedField(
        queryset=Shop.objects.all(),
        source='shop',
        write_only=True
    )

    class Meta:
        model = OrderItem
        fields = ['product_id', 'shop_id', 'quantity']


class OrderWriteSerializer(serializers.ModelSerializer):
    items = OrderItemWriteSerializer(many=True)

    class Meta:
        model = Order
        fields = ['items']

    def create(self, validated_data):
        print(f"OrderWriteSerializer create called with data: {validated_data}")
        items_data = validated_data.pop('items')
        print(f"Items data: {items_data}")
        
        # Получаем пользователя из контекста или используем None
        user = self.context.get('request').user if self.context.get('request') else None
        print(f"User from context: {user}")
        
        # Убираем user из validated_data, если он там есть
        validated_data.pop('user', None)
        
        order = Order.objects.create(
            user=user,
            **validated_data
        )
        print(f"Order created: {order.order_id}")

        for item_data in items_data:
            print(f"Creating order item: {item_data}")
            OrderItem.objects.create(order=order, **item_data)

        return order

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must contain at least one item.")
        return value