from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, AssistantCommandView
from .auth_views import signup, request_password_reset, reset_password
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/signup/', signup, name='signup'),
    path('auth/reset-request/', request_password_reset, name='reset-request'),
    path('auth/reset-password/', reset_password, name='reset-password'),
    path('assistant/command/', AssistantCommandView.as_view(), name='assistant-command'),
]
