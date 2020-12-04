from django.urls import re_path

from . import consumers
#(?P<username>\w+)
websocket_urlpatterns = [
    re_path(r'ws/gogoapp/welcome/(?P<username>\w+)/$', consumers.WelcomeConsumer.as_asgi()),
    re_path(r'ws/gogoapp/game/(?P<username>\w+)/(?P<hash_code>\w+)/$', consumers.GameConsumer.as_asgi()),
]