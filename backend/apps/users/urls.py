from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AccessibilityPreferencesViewSet

router = DefaultRouter()
router.register(r'profiles', UserViewSet)

urlpatterns = [
    # Map collection-level GET and PUT for preferences based on User Header
    path('preferences/', AccessibilityPreferencesViewSet.as_view({'get': 'list', 'put': 'put'})),
    path('', include(router.urls)),
]
