from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductSerializer, ShopSerializer
from products.models import *
from users.serializers import CustomUserSerializer

class OrderItemReadSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    price = serializers.DecimalField(source='product.price', read_only=True, max_digits=10, decimal_places=2)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'quantity', 'product_name', 'price', 'total_price']

    def get_total_price(self, obj):
        if obj.product and obj.product.price and obj.quantity:
            return obj.product.price * obj.quantity
        return 0

class OrderReadSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True, source='orderitem_set')
    shop_names = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    total_sum = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['order_id', 'created_at', 'status', 'items', 'shop_names', 'user_name', 'total_sum']

    def get_shop_names(self, obj):
        return list(set(item.shop.name for item in obj.orderitem_set.all()))

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return None

    def get_total_sum(self, obj):
        return sum(item.total_price for item in obj.orderitem_set.all())


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

    def validate(self, data):
        print(f"OrderItemWriteSerializer validate called with: {data}")
        
        # Проверяем, что все необходимые поля присутствуют
        if 'product' not in data:
            raise serializers.ValidationError("Product is required")
        if 'shop' not in data:
            raise serializers.ValidationError("Shop is required")
        if 'quantity' not in data:
            raise serializers.ValidationError("Quantity is required")
        
        # Проверяем, что количество положительное
        if data['quantity'] <= 0:
            raise serializers.ValidationError("Quantity must be positive")
        
        print(f"✅ OrderItemWriteSerializer validation passed")
        return data

    def to_internal_value(self, data):
        print(f"OrderItemWriteSerializer to_internal_value called with: {data}")
        result = super().to_internal_value(data)
        print(f"OrderItemWriteSerializer to_internal_value result: {result}")
        return result

    def create(self, validated_data):
        print(f"OrderItemWriteSerializer create called with: {validated_data}")
        try:
            result = super().create(validated_data)
            print(f"✅ OrderItemWriteSerializer create result: {result}")
            return result
        except Exception as e:
            print(f"❌ Error in OrderItemWriteSerializer.create: {e}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            raise


class OrderWriteSerializer(serializers.ModelSerializer):
    items = OrderItemWriteSerializer(many=True)

    class Meta:
        model = Order
        fields = ['items']

    def create(self, validated_data):
        print(f"OrderWriteSerializer create called with data: {validated_data}")
        items_data = validated_data.pop('items')
        print(f"Items data: {items_data}")

        user = self.context.get('request').user if self.context.get('request') else None
        print(f"User from context: {user}")

        validated_data.pop('user', None)
        
        # Валидация данных перед созданием
        for i, item_data in enumerate(items_data):
            print(f"Validating item {i+1}: {item_data}")
            if 'product' not in item_data:
                print(f"❌ Missing product in item {i+1}")
            if 'shop' not in item_data:
                print(f"❌ Missing shop in item {i+1}")
            if 'quantity' not in item_data:
                print(f"❌ Missing quantity in item {i+1}")
        
        try:
            order = Order.objects.create(
                user=user,
                **validated_data
            )
            print(f"✅ Order created: {order.order_id}")

            for item_data in items_data:
                print(f"Creating order item: {item_data}")
                order_item = OrderItem.objects.create(order=order, **item_data)
                print(f"✅ Order item created: {order_item.id}")

            return order
        except Exception as e:
            print(f"❌ Error in OrderWriteSerializer.create: {e}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            raise

    def validate(self, data):
        print(f"OrderWriteSerializer validate called with: {data}")
        result = super().validate(data)
        print(f"OrderWriteSerializer validate result: {result}")
        return result

    def validate_items(self, value):
        print(f"OrderWriteSerializer validate_items called with: {value}")
        
        if not value:
            raise serializers.ValidationError("Order must contain at least one item.")
        
        # Проверяем каждый элемент
        for i, item in enumerate(value):
            print(f"Validating item {i+1}: {item}")
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"Item {i+1} must be an object")
            
            required_fields = ['product', 'shop', 'quantity']
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(f"Item {i+1} missing required field: {field}")
        
        return value

class ShopOwnerOrderItemSerializer(serializers.ModelSerializer):
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


class ShopOwnerOrderSerializer(serializers.ModelSerializer):
    items = ShopOwnerOrderItemSerializer(many=True, read_only=True, source='orderitem_set')
    total_sum = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer_info = serializers.SerializerMethodField()
    shop_names = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'order_id',
            'user',
            'customer_info',
            'created_at',
            'status',
            'status_display',
            'items',
            'total_sum',
            'shop_names'
        ]
        read_only_fields = ['order_id', 'user', 'created_at']

    def get_total_sum(self, obj):
        total = 0
        for item in obj.orderitem_set.all():
            if item.product and item.product.price and item.quantity:
                total += item.product.price * item.quantity
        return total

    def get_customer_info(self, obj):
        if obj.user:
            return {
                'email': obj.user.email,
                'full_name': obj.user.get_full_name(),
                'phone': getattr(obj.user, 'phone', None)
            }
        return None

    def get_shop_names(self, obj):
        shops = set()
        for item in obj.orderitem_set.all():
            if item.shop:
                shops.add(item.shop.name)
        return list(shops)