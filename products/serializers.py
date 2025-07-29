from rest_framework import serializers
from .models import Shop,ShopCategory,Product
from map.models import Location

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
            'opening_hours'
        ]

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
            'products'
        ]