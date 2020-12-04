from django.urls import path
from .views import SignUpView
from . import views

#app_name = 'gogoapp'

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('signup/validate_username', views.validate_username, name='validate_username'),
    path('signup/validate_email', views.validate_email, name='validate_email'),
    path('welcome',views.welcome, name='welcome'),
    path('welcome/get_statistics',views.get_statistics, name='get_statistics'),
    path('welcome/create_game',views.create_game, name='create_game'),
    path('welcome/accept_game',views.accept_game, name='accept_game'),
    path('welcome/refuse_game',views.refuse_game, name='refuse_game'),
    path('game/<int:number>', views.game, name='game'),
    path('game/<int:number>/get_params', views.get_params, name='get_params'),

    path('signup_mobile',views.signup_mobile, name='signup_mobile'),
    path('login_mobile',views.login_mobile, name='login_mobile'),
]
