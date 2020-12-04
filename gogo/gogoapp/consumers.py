from channels.generic.websocket import WebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q
from .models import CustomUser, QueueGame
from .methods import matches_update, redirect_to_game, game_refused, check_current_match, update_turn, update_pass, update_surrender

import json

@database_sync_to_async
def set_channel_name(username,channel_name):
    CustomUser.objects.filter(Q(username__iexact=username)).update(channel_name=channel_name)

@database_sync_to_async
def get_channel_name(playername):
     player = CustomUser.objects.filter(Q(username__iexact=playername))
     if player:
        player = player[0]
        return player.channel_name

#Class to manage requests from websocket of welcome page
class WelcomeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope['url_route']['kwargs']['username']
        await self.channel_layer.group_add(
            'welcome',
            self.channel_name
        )
        await set_channel_name(self.username,self.channel_name)
        await self.accept()
        data = await matches_update(self.username)
        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'chat_message',
                'data': data
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            'welcome',
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        code = text_data_json['code']
        playername = text_data_json['playername']
        channel_name = await get_channel_name(playername)
        if(code == 0):
            data = await matches_update(playername)
        elif(code == 1):
            data = await redirect_to_game(playername)
        elif(code == 2):
            data = await game_refused(playername)
        await self.channel_layer.send(
            channel_name,
            {
                'type': 'chat_message',
                'data': data
            }
        )
   
    async def chat_message(self, event):
        data = event['data']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'data': data
        }))

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.hash_code = self.scope['url_route']['kwargs']['hash_code']
        self.username = self.scope['url_route']['kwargs']['username']
        self.room_number = 'room_%s' % self.hash_code
        await set_channel_name(self.username,self.channel_name)
        # Join room group
        await self.channel_layer.group_add(
            self.room_number,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_number,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        code = text_data_json['code']   
        if code == 0:
            id_move = text_data_json['id']
            username = text_data_json['username']
            data = await update_turn(username,self.hash_code,id_move)
            if 'error' in data.keys():
                channel_name = await get_channel_name(username)
                await self.channel_layer.send(
                    channel_name,
                    {
                      'type': 'chat_message',
                      'data': data
                    }
                )
            elif 'moves' in data.keys():
                if data['valid'] == True:
                   data = await check_current_match(self.hash_code)
                   await self.channel_layer.group_send(
                      self.room_number,
                      {
                          'type': 'chat_message',
                          'data': data
                      }
                   )
        elif code == 1:
           data = await check_current_match(self.hash_code)
           await self.channel_layer.group_send(
                    self.room_number,
                    {
                        'type': 'chat_message',
                        'data': data
                    }
                )
        elif code == 2:
           username = text_data_json['username']
           data = await update_pass(username,self.hash_code)
           data = await check_current_match(self.hash_code)
           await self.channel_layer.group_send(
                    self.room_number,
                    {
                        'type': 'chat_message',
                        'data': data
                    }
                )
        elif code == 3:
           username = text_data_json['username']
           data = await update_surrender(username,self.hash_code)
           data = await check_current_match(self.hash_code)
           await self.channel_layer.group_send(
                    self.room_number,
                    {
                        'type': 'chat_message',
                        'data': data
                    }
                )

    # Receive message from room group
    async def chat_message(self, event):
        data = event['data']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'data': data
        }))