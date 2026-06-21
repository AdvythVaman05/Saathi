from django.urls import re_path
from .consumers import SpeechConsumer

websocket_urlpatterns = [
    re_path(r'ws/speech/$', SpeechConsumer.as_asgi()),
]
