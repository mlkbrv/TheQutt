import uuid
from django.db import models
from products.models import Product, Shop
from users.models import CustomUser

class Order(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = "pending", "В ожидании"
        CONFIRMED = "confirmed", "Подтвержден"
        PREPARING = "preparing", "Готовится"
        READY = "ready", "Готов к выдаче"
        DELIVERED = "delivered", "Доставлен"
        CANCELLED = "cancelled", "Отменен"

    order_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
        max_length=20,
    )

    def __str__(self):
        return f"Order #{self.order_id} by {self.user.get_full_name()}"

    @property
    def items(self):
        return self.orderitem_set.all()

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='orderitem_set')
    quantity = models.PositiveIntegerField()
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.quantity}x {self.product.name} from {self.shop.name}"

    @property
    def total_price(self):
        return self.quantity * self.product.price