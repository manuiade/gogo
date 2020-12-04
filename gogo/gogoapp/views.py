from django.shortcuts import render, redirect
from django.urls import reverse_lazy, reverse
from django.views.generic.edit import CreateView
from django.contrib.auth.hashers import make_password, check_password
from django.http import JsonResponse, HttpResponse,HttpResponseRedirect
from django.template import loader
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

import re
import json

from .forms import CustomUserCreationForm, QueueGameForm
from .models import CustomUser, QueueGame, Gaming, History
from .methods import update_pass, update_surrender, statistics, create_a_game, accept_a_game, get_current_game

#Signup/Login handler for web app (CSRF protection)
class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'signup.html'

#Signup handler for mobile app (no CSRF protection needed)
@csrf_exempt
def signup_mobile(request):
   registered = False
   if request.method == 'POST':
       bytes = request.body
       user = json.loads(bytes)
       username = user["username"]
       email = user["email"]
       nationality = user["nationality"]
       password = user["password"]
       password = make_password(password)
       u = CustomUser(username = username, email = email, nationality = nationality, password = password)
       u.save()
       registered = True
   data = {'registered' : registered}
   return JsonResponse(data)

#Login handler for mobile app (no CRSF protection needed)
@csrf_exempt
def login_mobile(request):
   authenticated = False
   if request.method == 'POST':
       bytes = request.body
       user = json.loads(bytes)
       username = user["username"]
       password = user["password"]
       user =  CustomUser.objects.filter(Q(username__iexact=username))
       if user:
         user = user[0]
         if user.username == username and check_password(password,user.password):
           authenticated = True
   data = {'authenticated' : authenticated}
   return JsonResponse(data)

#Called each time welcome is rendered
def get_statistics(request):
    username = request.GET.get('username', None)
    data = statistics(username)
    return JsonResponse(data)

#Check if username already exists or is in invalid format
def validate_username(request):
        username = request.GET.get('username', None)
        match = re.search(r'^[a-zA-Z0-9]+([a-zA-Z0-9](_|-| )[a-zA-Z0-9])*[a-zA-Z0-9]+$', username, re.I)
        if match:
          is_valid = True
        else:
          is_valid = False
        data = { 'is_taken' : CustomUser.objects.filter(username__iexact=username).exists(), 'is_valid' : is_valid }
        return JsonResponse(data)


#Check if email already exists or is in invalid format
def validate_email(request):
        email = request.GET.get('email', None)
        is_valid = True
        is_taken = False
        if email != '':
            match = re.search(r'^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$', email, re.I)
            if not match:
                is_valid = False
            else:
                is_taken = CustomUser.objects.filter(email__iexact=email).exists()
        data = { 'is_taken' : is_taken , 'is_valid' : is_valid }
        return JsonResponse(data)


#Render welcome template for web app
#@login_required
def welcome(request):
        username = request.user.username
        current_game = Gaming.objects.filter(Q(username1__iexact=username) | Q(username2__iexact=username))
        if current_game:
            hash_code = current_game[0].hash_code
            return HttpResponseRedirect(reverse('game', args=(hash_code,)))
        context = {'username':username}
        template = loader.get_template('welcome.html')
        return HttpResponse(template.render(context,request))


@csrf_exempt
def create_game(request):
        print("create game")
        data = {}
        if request.method == 'POST':
            data = create_a_game(request)
        return JsonResponse(data)

@csrf_exempt
def accept_game(request):
        data = {}
        if request.method == 'POST':
            data = accept_a_game(request)
        return JsonResponse(data)

@csrf_exempt
def refuse_game(request):
        data = {}
        if request.method == 'POST':
           bytes = request.body
           params = json.loads(bytes)
           username = params["username"]
           playername = params["playername"]
           QueueGame.objects.filter(Q(username__iexact=playername) & Q(random__iexact='0')).update(refuse='2')
        return JsonResponse(data)


#Render game template if game is found for user, or render welcome page
def game(request,number):
       current_game = Gaming.objects.filter(hash_code__iexact=number)
       if current_game:
           context = {'username': request.user.username,'hash_code' : number}
           template = loader.get_template('game.html')
           return HttpResponse(template.render(context,request))
       else:
           return redirect("welcome")

#Called each time game template is rendered to get game status
def get_params(request,number):
       data = {}
       userRequest = request.GET.get('username',None)
       current_game = Gaming.objects.filter(hash_code__iexact=number)
       if current_game:
           data = get_current_game(current_game, userRequest,number)
       return JsonResponse(data)
