from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Order, OrderItem
from products.models import Shop, ShopCategory, Product
from map.models import Location

User = get_user_model()


class IsShopOwnerPermissionTest(APITestCase):
    def setUp(self):
        # Создаем пользователей
        self.shop_owner = User.objects.create_user(
            email='shopowner@test.com',
            password='testpass123',
            first_name='Shop',
            last_name='Owner'
        )
        
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            password='testpass123',
            first_name='Regular',
            last_name='User'
        )
        
        # Создаем категорию магазина
        self.category = ShopCategory.objects.create(name='Test Category')
        
        # Создаем локацию
        self.location = Location.objects.create(
            latitude=55.7558,
            longitude=37.6176,
            address='Test Address'
        )
        
        # Создаем магазин для shop_owner
        self.shop = Shop.objects.create(
            name='Test Shop',
            category=self.category,
            address='Test Address',
            description='Test Description',
            location=self.location,
            opening_hours='9:00-18:00',
            owner=self.shop_owner
        )
        
        # Создаем продукт
        self.product = Product.objects.create(
            name='Test Product',
            description='Test Description',
            quantity=10,
            price=100,
            shop=self.shop
        )
        
        # Создаем заказ
        self.order = Order.objects.create(
            user=self.regular_user,
            status='PENDING'
        )
        
        # Создаем элемент заказа
        self.order_item = OrderItem.objects.create(
            order=self.order,
            quantity=2,
            product=self.product,
            shop=self.shop
        )
        
        self.client = APIClient()
    
    def test_shop_owner_can_access_my_shop_orders(self):
        """Тест: владелец магазина может получить доступ к заказам своего магазина"""
        self.client.force_authenticate(user=self.shop_owner)
        url = reverse('my-shop-orders')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('orders', response.data)
        self.assertEqual(len(response.data['orders']), 1)
    
    def test_regular_user_cannot_access_my_shop_orders(self):
        """Тест: обычный пользователь не может получить доступ к заказам магазина"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('my-shop-orders')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthenticated_user_cannot_access_my_shop_orders(self):
        """Тест: неаутентифицированный пользователь не может получить доступ"""
        url = reverse('my-shop-orders')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_shop_owner_sees_only_their_shop_orders(self):
        """Тест: владелец магазина видит только заказы своего магазина"""
        # Создаем другой магазин с другим владельцем
        other_owner = User.objects.create_user(
            email='other@test.com',
            password='testpass123',
            first_name='Other',
            last_name='Owner'
        )
        
        other_shop = Shop.objects.create(
            name='Other Shop',
            category=self.category,
            address='Other Address',
            description='Other Description',
            location=self.location,
            opening_hours='9:00-18:00',
            owner=other_owner
        )
        
        other_product = Product.objects.create(
            name='Other Product',
            description='Other Description',
            quantity=5,
            price=50,
            shop=other_shop
        )
        
        other_order = Order.objects.create(
            user=self.regular_user,
            status='PENDING'
        )
        
        OrderItem.objects.create(
            order=other_order,
            quantity=1,
            product=other_product,
            shop=other_shop
        )
        
        # Проверяем, что shop_owner видит только заказы своего магазина
        self.client.force_authenticate(user=self.shop_owner)
        url = reverse('my-shop-orders')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['orders']), 1)
        self.assertEqual(response.data['orders'][0]['order_id'], str(self.order.order_id))


class MyShopOrderListCreateAPIViewTest(APITestCase):
    def setUp(self):
        # Создаем пользователя-владельца магазина
        self.shop_owner = User.objects.create_user(
            email='shopowner@test.com',
            password='testpass123',
            first_name='Shop',
            last_name='Owner'
        )
        
        # Создаем категорию магазина
        self.category = ShopCategory.objects.create(name='Test Category')
        
        # Создаем локацию
        self.location = Location.objects.create(
            latitude=55.7558,
            longitude=37.6176,
            address='Test Address'
        )
        
        # Создаем магазин
        self.shop = Shop.objects.create(
            name='Test Shop',
            category=self.category,
            address='Test Address',
            description='Test Description',
            location=self.location,
            opening_hours='9:00-18:00',
            owner=self.shop_owner
        )
        
        # Создаем продукт
        self.product = Product.objects.create(
            name='Test Product',
            description='Test Description',
            quantity=10,
            price=100,
            shop=self.shop
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.shop_owner)
    
    def test_create_order_by_shop_owner(self):
        """Тест: владелец магазина может создать заказ"""
        url = reverse('my-shop-orders')
        data = {
            'items': [
                {
                    'product_id': self.product.id,
                    'shop_id': self.shop.id,
                    'quantity': 2
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_list_orders_with_customer_info(self):
        """Тест: API возвращает информацию о клиентах в заказах"""
        # Создаем заказ
        customer = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            first_name='Customer',
            last_name='Name'
        )
        
        order = Order.objects.create(
            user=customer,
            status='PENDING'
        )
        
        OrderItem.objects.create(
            order=order,
            quantity=1,
            product=self.product,
            shop=self.shop
        )
        
        url = reverse('my-shop-orders')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('orders', response.data)
        self.assertEqual(len(response.data['orders']), 1)
        
        order_data = response.data['orders'][0]
        self.assertIn('customer_info', order_data)
        self.assertEqual(order_data['customer_info']['email'], 'customer@test.com')
        self.assertIn('shop_names', order_data)
        self.assertIn('Test Shop', order_data['shop_names'])
