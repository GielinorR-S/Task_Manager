from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from tasks import urls as task_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(task_urls)),
]
