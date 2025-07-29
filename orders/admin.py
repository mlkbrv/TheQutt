from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    """Inline для отображения элементов заказа в админке заказа"""
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']
    fields = ['product', 'shop', 'quantity', 'total_price']
    
    def total_price(self, obj):
        """Отображение общей стоимости элемента заказа"""
        if obj.pk:
            return f"${obj.total_price}"
        return "-"
    total_price.short_description = "Total Price"

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Админка для модели Order"""
    list_display = [
        'order_id', 
        'user_info', 
        'status', 
        'created_at', 
        'total_items', 
        'total_amount',
        'status_color'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['order_id', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['order_id', 'created_at', 'total_amount_display']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_id', 'user', 'status', 'created_at')
        }),
        ('Order Summary', {
            'fields': ('total_amount_display',),
            'classes': ('collapse',)
        }),
    )
    
    def user_info(self, obj):
        """Отображение информации о пользователе"""
        if obj.user:
            return f"{obj.user.get_full_name()} ({obj.user.email})"
        return "-"
    user_info.short_description = "Customer"
    
    def total_items(self, obj):
        """Подсчет общего количества товаров в заказе"""
        return sum(item.quantity for item in obj.items)
    total_items.short_description = "Total Items"
    
    def total_amount(self, obj):
        """Подсчет общей суммы заказа"""
        total = sum(item.total_price for item in obj.items)
        return f"${total}"
    total_amount.short_description = "Total Amount"
    
    def total_amount_display(self, obj):
        """Отображение общей суммы в readonly поле"""
        if obj.pk:
            total = sum(item.total_price for item in obj.items)
            return f"${total}"
        return "-"
    total_amount_display.short_description = "Total Amount"
    
    def status_color(self, obj):
        """Отображение статуса с цветом"""
        colors = {
            'PENDING': '#FFA500',  # Orange
            'CONFIRMED': '#008000',  # Green
            'REJECTED': '#FF0000',  # Red
        }
        color = colors.get(obj.status, '#000000')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_color.short_description = "Status"
    
    def get_queryset(self, request):
        """Оптимизация запросов"""
        return super().get_queryset(request).select_related('user').prefetch_related('orderitem_set__product', 'orderitem_set__shop')
    
    actions = ['confirm_orders', 'reject_orders']
    
    def confirm_orders(self, request, queryset):
        """Действие для подтверждения заказов"""
        updated = queryset.update(status=Order.StatusChoices.CONFIRMED)
        self.message_user(request, f"{updated} order(s) were successfully confirmed.")
    confirm_orders.short_description = "Confirm selected orders"
    
    def reject_orders(self, request, queryset):
        """Действие для отклонения заказов"""
        updated = queryset.update(status=Order.StatusChoices.REJECTED)
        self.message_user(request, f"{updated} order(s) were successfully rejected.")
    reject_orders.short_description = "Reject selected orders"

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Админка для модели OrderItem"""
    list_display = [
        'order_link', 
        'product', 
        'shop', 
        'quantity', 
        'unit_price', 
        'total_price_display'
    ]
    list_filter = ['shop', 'product']
    search_fields = ['order__order_id', 'product__name', 'shop__name']
    readonly_fields = ['unit_price', 'total_price_display']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order', 'product', 'shop')
        }),
        ('Quantity and Pricing', {
            'fields': ('quantity', 'unit_price', 'total_price_display')
        }),
    )
    
    def order_link(self, obj):
        """Ссылка на заказ"""
        if obj.order:
            url = reverse('admin:orders_order_change', args=[obj.order.pk])
            return format_html('<a href="{}">{}</a>', url, obj.order.order_id)
        return "-"
    order_link.short_description = "Order"
    
    def unit_price(self, obj):
        """Отображение цены за единицу"""
        if obj.product:
            return f"${obj.product.price}"
        return "-"
    unit_price.short_description = "Unit Price"
    
    def total_price_display(self, obj):
        """Отображение общей стоимости"""
        if obj.pk:
            return f"${obj.total_price}"
        return "-"
    total_price_display.short_description = "Total Price"
    
    def get_queryset(self, request):
        """Оптимизация запросов"""
        return super().get_queryset(request).select_related('order', 'product', 'shop')

# Настройка админки
admin.site.site_header = "TheQutt Orders Administration"
admin.site.site_title = "TheQutt Orders Admin"
admin.site.index_title = "Welcome to TheQutt Orders Administration"
