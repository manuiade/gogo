from django.contrib.auth.models import AbstractUser
from django.db import models
from django_mysql.models import ListTextField

class CustomUser(AbstractUser):
    nationality = models.CharField(max_length=50,default='',blank=False)
    elo = models.IntegerField(default=500)
    win = models.IntegerField(default=0)
    lose = models.IntegerField(default=0)
    winrate = models.FloatField(default=0)
    loserate = models.FloatField(default=0)
    best_elo = models.IntegerField(default=500)
    channel_name = models.CharField(max_length=100,default='')
    def __str__(self):
        return self.username

class QueueGame(models.Model):
   username = models.CharField(max_length=50)
   elo = models.IntegerField()
   time = models.CharField(max_length=50)
   dim = models.CharField(max_length=50)
   playerName = models.CharField(max_length=50,default='')
   random = models.CharField(max_length=50,default='')
   refuse = models.CharField(max_length=50,default='')

class Gaming(models.Model):
   username1 = models.CharField(max_length=50)
   username2 = models.CharField(max_length=50)
   elo1 = models.IntegerField()
   elo2 = models.IntegerField()
   time1 = models.IntegerField(default=0)
   time2 = models.IntegerField(default=0)
   timer1 = models.IntegerField(default=0)
   timer2 = models.IntegerField(default=0)
   eat_ball = models.IntegerField(default=-1)
   dim = models.IntegerField(default=9)
   id_move = models.IntegerField(default=0)
   moves = ListTextField(base_field=models.IntegerField(default=0),size=500, default=0)
   hash_code = models.IntegerField(default=0)
   score1 = models.IntegerField(default=0)
   score2 = models.FloatField(default=5.5)
   pedine1 = models.IntegerField(default=0)
   pedine2 = models.IntegerField(default=0)
   pass_flag = models.IntegerField(default=0)
   last_move = models.IntegerField(default=0)

class History(models.Model):
  winner = models.CharField(max_length=50)
  loser = models.CharField(max_length=50)
  hash_code = models.IntegerField(default=0)
  victory = models.IntegerField(default=0)
