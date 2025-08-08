from rest_framework import permissions
from products.models import Shop


class IsAdminUser(permissions.BasePermission):
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.is_staff


class IsOwnerOfShop(permissions.BasePermission):
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        elif hasattr(obj, 'shop'):
            return obj.shop.owner == request.user
        return False


class IsShopOwnerOrReadOnly(permissions.BasePermission):
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        elif hasattr(obj, 'shop'):
            return obj.shop.owner == request.user
        return False


class IsProductOwnerOrReadOnly(permissions.BasePermission):
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.shop.owner == request.user


class IsShopOwnerForProduct(permissions.BasePermission):
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        if request.method == 'POST':
            shop_id = request.data.get('shop')
            if shop_id:
                try:
                    shop = Shop.objects.get(id=shop_id)
                    return shop.owner == request.user
                except Shop.DoesNotExist:
                    return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.shop.owner == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user.is_authenticated and request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user.is_authenticated and request.user.is_staff

