from django.contrib import admin
from django.urls import path, include
from .views import health_check, ready_check

urlpatterns = [
    path('health', health_check, name='health'),
    path('ready', ready_check, name='ready'),
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/surveys/', include('apps.surveys.urls')),
    path('api/responses/', include('apps.responses.urls')),
    path('api/speech/', include('apps.speech.urls')),
]
