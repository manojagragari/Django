from django.contrib import admin
from .models import Product
from .models import Category
from .models import Sale
from .models import Expense

admin.site.register(Expense)
admin.site.register(Sale)
admin.site.register(Category)
admin.site.register(Product)

