from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import CustomUser, QueueGame

class CustomUserCreationForm(UserCreationForm):
    nationality = forms.CharField(help_text="nationality")
    class Meta:
        model = CustomUser
        fields = ('username', 'email','nationality')

class CustomUserChangeForm(UserChangeForm):
    nationality = forms.CharField(help_text="nationality")
    class Meta:
        model = CustomUser
        fields = ('username', 'email','nationality')

class QueueGameForm(forms.Form):
   dim = forms.CharField(required=True,help_text="dim")
   time = forms.CharField(required=True,help_text="time")
   playerName = forms.CharField(required=False,help_text="playerName")
   random = forms.CharField(required=False,help_text="random")
   class Meta:
        model = QueueGame
        fields = ('dim','time','playerName','random')
