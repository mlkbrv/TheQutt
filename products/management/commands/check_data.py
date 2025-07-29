from django.core.management.base import BaseCommand
from products.models import Shop, Product, ShopCategory

class Command(BaseCommand):
    help = 'Check data in database'

    def handle(self, *args, **options):
        self.stdout.write('Checking shops...')
        shops = Shop.objects.all()
        self.stdout.write(f'Found {shops.count()} shops')
        
        for shop in shops:
            self.stdout.write(f'  - {shop.name} (ID: {shop.id})')
            if shop.picture:
                self.stdout.write(f'    Picture: {shop.picture}')
            else:
                self.stdout.write(f'    No picture')
        
        self.stdout.write('\nChecking products...')
        products = Product.objects.all()
        self.stdout.write(f'Found {products.count()} products')
        
        for product in products:
            self.stdout.write(f'  - {product.name} (ID: {product.id})')
            if product.picture:
                self.stdout.write(f'    Picture: {product.picture}')
            else:
                self.stdout.write(f'    No picture')
        
        self.stdout.write('\nChecking categories...')
        categories = ShopCategory.objects.all()
        self.stdout.write(f'Found {categories.count()} categories')
        
        for category in categories:
            self.stdout.write(f'  - {category.name} (ID: {category.id})') 