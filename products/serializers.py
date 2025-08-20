from rest_framework import serializers
from users.models import CustomUser
from .models import Shop,ShopCategory,Product
from map.models import Location
from django.conf import settings

class ShopOwnerSerializer(serializers.ModelSerializer):
    shops = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'shops'
        ]
    
    def get_shops(self, obj):
        shops = obj.shops.all()
        return [
            {
                'id': shop.id,
                'name': shop.name,
                'category': shop.category.name,
                'address': shop.address
            }
            for shop in shops
        ]

class ShopCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopCategory
        fields = '__all__'

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'description', 'latitude', 'longitude']

class ShopSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', read_only=True)
    location = LocationSerializer(read_only=True)
    owner = ShopOwnerSerializer(read_only=True)
    picture = serializers.SerializerMethodField()
    
    def get_picture(self, obj):
        if obj.picture:
            return obj.picture.name.replace('shop_pictures/', '')
        return None
    
    class Meta:
        model = Shop
        fields = [
            'id',
            'name',
            'category',
            'description',
            'address',
            'location',
            'picture',
            'opening_hours',
            'owner'
        ]

class ShopCreateSerializer(serializers.ModelSerializer):
    category = serializers.CharField(
        required=True,
        help_text="Category name for this shop (e.g., 'restaurant', 'cafe')"
    )
    location = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(),
        required=False,
        allow_null=True,
        help_text="Select the location for this shop (optional)"
    )
    
    class Meta:
        model = Shop
        fields = [
            'id',
            'name',
            'category',
            'description',
            'address',
            'location',
            'picture',
            'opening_hours',
        ]
    
    def create(self, validated_data):
        category_name = validated_data.pop('category')
        category, created = ShopCategory.objects.get_or_create(name=category_name.lower())
        validated_data['category'] = category
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    
    def to_representation(self, instance):
        return ShopSerializer(instance).data

class ShopNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = [
            'id',
            'name',
        ]

class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'quantity',
            'price',
            'shop',
            'picture',
        ]
        read_only_fields = ['id']

    def validate_shop(self, value):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if value.owner != request.user:
                raise serializers.ValidationError("You can only add products to your own shops")
        return value

class ProductSerializer(serializers.ModelSerializer):
    shop = ShopNameSerializer(read_only=True)
    picture = serializers.SerializerMethodField()

    def get_picture(self, obj):
        if obj.picture:
            # Возвращаем только имя файла
            return obj.picture.name.replace('product_pictures/', '')
        return None

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'quantity',
            'price',
            'shop',
            'picture',
        ]

class ShopWithProductsSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', read_only=True)
    location = LocationSerializer(read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    picture = serializers.SerializerMethodField()
    
    def get_picture(self, obj):
        if obj.picture:
            return obj.picture.name.replace('shop_pictures/', '')
        return None
    
    class Meta:
        model = Shop
        fields = [
            'id',
            'name',
            'category',
            'description',
            'address',
            'location',
            'picture',
            'opening_hours',
            'products',
        ]