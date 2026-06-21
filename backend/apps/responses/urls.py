from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SessionViewSet, SessionAnswerViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'sessions', SessionViewSet)
router.register(r'answers', SessionAnswerViewSet)
router.register(r'telemetry', AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
