# shop/views/home_views.py
from django.http import HttpResponse

def home(request):
    return HttpResponse("<h1>Welcome to ElectroShop Dashboard!</h1>")
