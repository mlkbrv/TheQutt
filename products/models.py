from django.db import models

class ShopCategory(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Shop(models.Model):
    name = models.CharField(max_length=255)
    category = models.ForeignKey(ShopCategory, on_delete=models.CASCADE)
    address = models.CharField(max_length=255)
    description = models.TextField()
    location = models.ForeignKey('map.Location', on_delete=models.CASCADE, related_name='shops', null=True, blank=True)
    picture = models.ImageField(upload_to='shop_pictures/', null=True, blank=True)
    opening_hours = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    quantity = models.IntegerField()
    price = models.IntegerField()
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    picture = models.ImageField(upload_to='product_pictures/', null=True, blank=True)

    def __str__(self):
        return self.name
