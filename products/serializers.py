from rest_framework import serializers
from users.models import CustomUser
from .models import Shop,ShopCategory,Product
from map.models import Location

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
    category = ShopCategorySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    owner = ShopOwnerSerializer(read_only=True)
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
    """
    Serializer for creating shops by admin with owner selection
    """
    owner = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        required=True,
        help_text="Select the owner for this shop"
    )
    category = serializers.PrimaryKeyRelatedField(
        queryset=ShopCategory.objects.all(),
        required=True,
        help_text="Select the category for this shop"
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
            'owner'
        ]
    
    def to_representation(self, instance):
        """Return full shop data when serializing"""
        return ShopSerializer(instance).data

class ShopNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = [
            'id',
            'name',
        ]

class ProductSerializer(serializers.ModelSerializer):
    shop = ShopNameSerializer(read_only=True)

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
    category = ShopCategorySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    
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