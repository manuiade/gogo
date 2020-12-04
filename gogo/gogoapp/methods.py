from django.db.models import Q
from random import randrange
from threading import Thread, Lock
from channels.db import database_sync_to_async
import re
import time
import json

from .models import CustomUser, QueueGame, Gaming, History

mutexRandom = Lock()
mutexPlayer = Lock()

#Redirect user to game if exists
@database_sync_to_async
def redirect_to_game(userRequest):
    data = {}
    game = Gaming.objects.filter(Q(username1__iexact=userRequest) | Q(username2__iexact=userRequest))
    if game:
        hash_code = game[0].hash_code
        data = {'hash_code' : hash_code}
        return data

#Called when user refuse a game
@database_sync_to_async
def game_refused(userRequest):
    data = {}
    listQueue = QueueGame.objects.filter(Q(username__iexact=userRequest))
    for q in listQueue:
        q_player = q.playerName
        if q.refuse == '2':
            QueueGame.objects.filter(Q(username__iexact=userRequest) & Q(refuse__iexact='2') & Q(playerName__iexact=q_player)).delete()
            data = {'refuse' : q_player + " has refused your request.."}
    return data

#Return all matches which a user has been invited
@database_sync_to_async
def matches_update(userRequest):
    data = {}
    queues = QueueGame.objects.filter(Q(playerName__iexact=userRequest) & ~Q(refuse__iexact='2'))
    queueUsername = []
    queueElo = []
    queueDim = []
    queueTime = []
    for qg in queues:
        queueUsername.append(qg.username)
        queueElo.append(qg.elo)
        queueDim.append(qg.dim)
        queueTime.append(qg.time)
    data = {'queueUsername' : queueUsername, 'queueElo':queueElo,'queueDim':queueDim,'queueTime':queueTime}
    return data

#Manage game creation (random or custom)
def create_a_game(request):
    bytes = request.body
    params = json.loads(bytes)
    username = params["username"]
    elo = params["elo"]
    time = params["time"]
    dim = params["dim"]
    if dim == "":
        dim = "9x9"
    if time == "":
        time = "3min"
    playerName = params["playername"]          
    pN = CustomUser.objects.filter(username__iexact=playerName)
    data = {}
    message = ""
    if playerName != "":
        if not pN:
            message = "Player " + playerName + " does not exist"
            data = {'message' : message}
            return data
    if playerName == username:
        data = {'message' : "You can't play against yourself"}
        return data         
    if QueueGame.objects.filter(Q(username__iexact=username) & Q(playerName__iexact=playerName)):
        data = {'message' : 'You already did this kind of request'}
        return data
    if pN:                           
        queue = QueueGame(username=username, elo=elo, time=time, dim=dim, playerName = pN[0].username, random = '0', refuse = '1')                      
        queue.save()
    else:
        if QueueGame.objects.filter(Q(username__iexact=username) & Q(random__iexact='1')):
            data = {'message' : 'You already did this kind of request'}
            return data
        queue = QueueGame(username=username, elo=elo, time=time, dim=dim, random = '1', refuse = '1')
        queue.save()
    if queue.random == '1':
        hash_code = matchmaking(username,elo)
        if hash_code == 0:                 
            data = {'message' : 'No challenger found..'}
        else:
            data = {'hash_code' : hash_code}
    else:
        data = {'invioPlayer' : "Request to " + playerName + " send"}
    return data

#Add new game to database formatting parameters and generating unique hashcode
def game_details(queue,username1,username2,elo): 
    dim_string = queue[0].dim     
    dim_list = list(map(int, re.findall('\d+',dim_string)))
    dim = dim_list[0]
    time_string = queue[0].time
    time_list = list(map(int, re.findall('\d+',time_string)))
    tim = time_list[0] * 60  
    hash_code = (hash(username1 + username2) % 1000000000) + randrange(1000000000) + 1              
    moves = [0] * (dim * dim)
    pedine1 = int((dim*dim)/2) + 1
    pedine2 = int((dim*dim)/2)
    gaming = Gaming(username1=username1, username2=username2, elo1=elo, elo2=queue[0].elo, time1=time.time(), time2=time.time(), timer1=tim, timer2=tim, dim=dim, hash_code = hash_code,moves=moves, pedine1 = pedine1, pedine2 = pedine2)
    return gaming

#Wait for random opponent with same game parameters, stops after 30 seconds
def matchmaking(username,elo):  
    my_qg = QueueGame.objects.filter(Q(username__iexact=username))[0]
    start = time.time()
    startTime = time.time()
    elo_range = 200
    global mutexRandom
    hash_code = 0
    while(1):
        qg = QueueGame.objects.filter(~Q(username__iexact=username) & Q(time__iexact=my_qg.time) & Q(dim__iexact=my_qg.dim) & Q(elo__range=(elo-elo_range,elo + elo_range)) & Q(random__iexact='1'))
        my_game = Gaming.objects.filter(Q(username1__iexact=username) | Q(username2__iexact=username))
        if my_game:
            QueueGame.objects.filter(username__iexact=username).delete()
            hash_code = my_game[0].hash_code
            return hash_code
        if qg:            
            gaming = game_details(qg,username,qg[0].username,elo)
            hash_code = gaming.hash_code
            other = Gaming.objects.filter(username1__iexact=username, username2__iexact=qg[0].username)
            game_exists = Gaming.objects.filter(Q(username1__iexact=qg[0].username) | Q(username2__iexact=qg[0].username))          
            mutexRandom.acquire()
            if not other and not game_exists:
                gaming.save()
                QueueGame.objects.filter(username__iexact=username).delete()
                mutexRandom.release()
                return hash_code
            mutexRandom.release()
        end = time.time()
        diff_time =  end-start
        if diff_time > 5:
            elo_range += 50
            start = time.time()
        diff_time_wait = end - startTime
        if diff_time_wait > 29:
            QueueGame.objects.filter(Q(username__iexact=username) & Q(random__iexact='1')).delete()
            return 0

#Create a game if user accept a request (mutual exclusion granted)
def accept_a_game(request):
    bytes = request.body
    params = json.loads(bytes)
    username = params["username"]
    elo = params["elo"]
    playername = params["playername"]
    queue = QueueGame.objects.filter(Q(username__iexact=playername))
    data = {}
    global mutexPlayer
    if queue:
        gaming = game_details(queue,username,playername,elo)
        game_exists = Gaming.objects.filter(Q(username1__iexact=playername) | Q(username2__iexact=playername))
        mutexPlayer.acquire()
        if not game_exists:
            gaming.save()
            QueueGame.objects.filter(username__iexact=username).delete()
            QueueGame.objects.filter(username__iexact=playername).delete()
            mutexPlayer.release()
            data = {'hash_code' : gaming.hash_code}                   
            return data
        mutexPlayer.release()              
    return data

#Get user statistics and last 10 games
def statistics(username):
    user =  CustomUser.objects.filter(Q(username__iexact=username))
    data = {}
    in_game = 0
    if user:
      user = user[0]
      hist = History.objects.filter(Q(winner__iexact=user.username) | Q(loser__iexact=user.username)).order_by('-id')[:10]
      winners = []
      losers = []
      for h in hist:
          winners.append(h.winner)
          losers.append(h.loser)
      current_game = Gaming.objects.filter(Q(username1__iexact=username) | Q(username2__iexact=username))
      if current_game:
          in_game = current_game[0].hash_code
      data = {'elo' : user.elo, 'nationality' : user.nationality, 'win': user.win, 'lose' : user.lose, 'winrate' : user.winrate, 'loserate': user.loserate, 'best_elo': user.best_elo, 'winners' : winners, 'losers' : losers, 'in_game' : in_game}
    return data


#Calculate current game status and updates time left for player in database
def get_current_game(current_game,userRequest,number):
    moves = ""
    current_timer1 = current_game[0].timer1
    current_timer2 = current_game[0].timer2
    next_player = ""   
    if current_game[0].id_move % 2 == 0:
        current_timer1 = update_timers(current_game[0].timer1, current_game[0].time1)
        next_player = current_game[0].username1
        if current_timer1 <= 0:
            current_timer1 = 0
        Gaming.objects.filter(Q(hash_code__iexact=number)).update(timer1=current_timer1, time1=time.time(),time2=time.time())
    else:
        current_timer2 = update_timers(current_game[0].timer2, current_game[0].time2)
        next_player = current_game[0].username2
        if current_timer2 <= 0:
            current_timer2 = 0
        Gaming.objects.filter(Q(hash_code__iexact=number)).update(timer2=current_timer2, time1=time.time(),time2=time.time())
    for i in current_game[0].moves:
        moves += str(i)
    data = {'hash_code': current_game[0].hash_code, 'next_player' : next_player , 'username1': current_game[0].username1, 'username2':current_game[0].username2, 'elo1': current_game[0].elo1, 'elo2': current_game[0].elo2,  'pedine1': current_game[0].pedine1, 'pedine2': current_game[0].pedine2, 'score1': current_game[0].score1, 'score2': current_game[0].score2, 'username' : userRequest, 'moves' : moves, 'current_timer1' : current_timer1, 'current_timer2' : current_timer2, 'id_move': current_game[0].id_move, 'dim': current_game[0].dim}
    return data

############## GAME RULES ###############

#Check if adjacent cell is free
def check_edge(moves,dim,last_move,cosa):  
   row = int(last_move / dim)
   col = last_move % dim
   flag = 0
   if row - 1 >=0:
       if moves[last_move - dim] == cosa:
           flag += 1
   else:
       flag += 1
   if row + 1 < dim:
       if moves[last_move + dim] == cosa:
           flag += 1
   else:
       flag += 1
   if col - 1  >=0:
       if moves[last_move - 1] == cosa:
           flag += 1
   else:
       flag += 1
   if col + 1 < dim:
       if moves[last_move + 1] == cosa:
           flag += 1
   else:
       flag += 1
   return flag

#Check recursively if a region of cells is completely trapped
def recursive_check(moves,dim,index,cosa,c_index,record):
    row = int(index / dim)
    col = index % dim
    if col - 1 >= 0:
        if moves[index - 1] == 0:
            return True
    if row - 1 >= 0:
        if moves[index - dim] == 0:
           return True
    if col + 1 < dim:
        if moves[index + 1] == 0:
           return True
    if row + 1 < dim: 
        if moves[index + dim] == 0:
            return True   
    if col - 1 >= 0:
        if moves[index - 1] == cosa and index - 1 not in c_index:           
            c_index.append(index)
            if recursive_check(moves,dim,index-1,cosa,c_index,record):
                c_index.remove(index)
                return True
            c_index.remove(index)
    if row - 1 >= 0:
        if moves[index - dim] == cosa and index - dim not in c_index:          
            c_index.append(index)
            if recursive_check(moves,dim,index-dim,cosa,c_index,record):
                c_index.remove(index)
                return True
            c_index.remove(index)
    if col + 1 < dim: 
        if moves[index + 1] == cosa and index + 1 not in c_index:           
            c_index.append(index)
            if recursive_check(moves,dim,index+1,cosa,c_index,record):
                c_index.remove(index)
                return True
            c_index.remove(index)
    if row + 1 < dim: 
        if moves[index + dim] == cosa and index + dim not in c_index:           
            c_index.append(index)
            if recursive_check(moves,dim,index+dim,cosa,c_index,record):
                c_index.remove(index)
                return True
            c_index.remove(index)
    record.append(index)
    return False

#Check move validity and update database or return error message
def check_liberty(moves, turn, dim, eat_ball, last_move):
    record = []
    c_index = []
    last_eat = -1
    valid = True
    message = ""   
    score_list = []   
    for index, cosa in enumerate(moves):
        if turn % 2 == 0 and cosa == 1 and index == eat_ball:
            if index + dim == last_move or index - dim == last_move or index + 1 == last_move or index - 1 == last_move:
                flag = check_edge(moves,dim,last_move,cosa)
                if flag == 4:
                    moves[index] = 0
                    valid = False
                    message = "Move not valid: KO"
                    break
        if turn % 2 == 0 and cosa == 2:
            if recursive_check(moves,dim,index,cosa,c_index,record):
               continue
            else:
               if len(record) == 1:
                   last_eat = record[0]
               for item in record:
                   moves[item] = 0
                   if item not in score_list:
                       score_list.append(item)  
        if turn % 2 == 1 and cosa == 2 and index == eat_ball:
            if index + dim == last_move or index - dim == last_move or index + 1 == last_move or index - 1 == last_move:
                flag = check_edge(moves,dim,last_move,cosa)
                if flag == 4:
                    moves[index] = 0
                    valid = False
                    message =  "Move not valid: KO" 
                    break
        if turn % 2 == 1 and cosa == 1:
            if recursive_check(moves,dim,index,cosa,c_index,record):
               continue
            else:
               if len(record) == 1:
                   last_eat = record[0]
               for item in record:
                   moves[item] = 0
                   if item not in score_list:
                       score_list.append(item)
    for index, cosa in enumerate(moves):
        if turn % 2 == 0 and cosa == 1:
            if recursive_check(moves,dim,index,cosa,c_index,record):
               continue
            else:
               for item in record:
                   valid = False
                   message = "Move not valid: Suicide"
        if turn % 2 == 1 and cosa == 2:
            if recursive_check(moves,dim,index,cosa,c_index,record):
               continue
            else:
               for item in record:
                   valid = False
                   message = "Move not valid: Suicide"
    return moves, last_eat, valid, message, len(score_list)

#Calculate time passed
def update_timers(timerX,timeX):
    lap = time.time()   
    tim = timerX
    diff = timeX
    timer1 = tim - (lap - diff) 
    return timer1

#Called when user make a move, check move validity and update game parameters
@database_sync_to_async
def update_turn(userRequest,number,id_move):
    cg = Gaming.objects.filter(hash_code__iexact=number)
    moves = []
    moves1 = ""
    username = ""
    last_move = 0
    valid = False
    if cg:
        current_game = cg[0]
        turn = current_game.id_move
        eat_ball = current_game.eat_ball
        moves = current_game.moves
        last_move = current_game.last_move
        score1_tmp = current_game.score1
        score2_tmp = current_game.score2
        ped1 = current_game.pedine1
        ped2 = current_game.pedine2      
        if turn % 2 == 0:
            username = current_game.username1
        else:
            username = current_game.username2
        if turn % 2 == 0 and userRequest == current_game.username1:
            if ped1 == 0:
                data = {'username' : username, 'error' : 'No stones left. You may only pass (or surrender)'}
                return data
            if moves[int(id_move)] == 0:
                moves[int(id_move)] = 1
                moves, last_eat, valid, message, score = check_liberty(moves, turn, current_game.dim, eat_ball,last_move)
                if valid:
                    valid = True
                    timer1 = update_timers(current_game.timer1, current_game.time1)
                    Gaming.objects.filter(hash_code__iexact=number).update(moves=moves,id_move = turn + 1,timer1 = timer1, time2 = time.time(), eat_ball = last_eat, score1 = score1_tmp + score, pedine1 = ped1 - 1, pedine2 = ped2 + score, pass_flag = 0, last_move = id_move)
                    username = current_game.username2
                else:
                    username = current_game.username1
                    data = {'username' : username, 'error' : message}
                    return data
        elif turn % 2 == 1 and userRequest == current_game.username2:
            if ped2 == 0:
                data = {'username' : username, 'error' : 'No stones left. You may only pass (or surrender)'}
                return data
            if moves[int(id_move)] == 0:
                moves[int(id_move)] = 2
                moves, last_eat, valid, message, score = check_liberty(moves, turn, current_game.dim, eat_ball,last_move)
                if valid:
                     valid = True
                     timer2 = update_timers(current_game.timer2, current_game.time2)
                     Gaming.objects.filter(hash_code__iexact=number).update(moves=moves,id_move = turn + 1, time1 = time.time(), timer2 = timer2,  eat_ball = last_eat, score2 = score2_tmp + score, pedine2 = ped2 - 1, pedine1 = ped1 + score, pass_flag = 0, last_move = id_move)
                     username = current_game.username1
                else:
                     username = current_game.username2
                     data = {'username' : username, 'error' : message}
                     return data
        for i in moves:
            moves1 += str(i)       
        data = {'username' : username, 'moves' : moves1, 'last_move' : last_move,'valid' : valid}
        return data

#Get current game status
@database_sync_to_async
def check_current_match(number):
    cg = Gaming.objects.filter(hash_code__iexact=number)
    data = {}
    if cg:
        current_game = cg[0]     
        timer = 0
        if current_game.id_move % 2 == 1:
           username = current_game.username2
           timer = update_timers(current_game.timer2, current_game.time2)
           if timer < 0:
               message = "Time out, wins: " + current_game.username1
               finish_game(number,current_game,2)
               data = {'winner' : message ,'victory' : 2, 'player' : current_game.username1}
               return data
        elif current_game.id_move % 2 == 0:
           username = current_game.username1
           timer = update_timers(current_game.timer1, current_game.time1)
           if timer < 0:
               message = "Time out, wins: " + current_game.username2
               finish_game(number,current_game,2)
               data = {'winner' : message ,'victory' : 2, 'player' : current_game.username2}
               return data
        moves = current_game.moves
        turn = current_game.id_move
        score1 = current_game.score1
        score2 = current_game.score2
        pedine1 = current_game.pedine1
        pedine2 = current_game.pedine2
        data = {'username' : username, 'moves' : moves, 'id_move' : turn, 'score1' : score1, 'score2' : score2, 'pedine1' : pedine1, 'pedine2' : pedine2,'timer1' : current_game.timer1, 'timer2' : current_game.timer2}
    else:
        data = win_type(number)
    return data

#Called when a user passes his turn, if 2 consecutives passes manages end game
@database_sync_to_async
def update_pass(userRequest,number):
    cg = Gaming.objects.filter(hash_code__iexact=number)
    data = {}
    if cg:
        current_game = cg[0]
        turn = current_game.id_move
        passa = current_game.pass_flag
        if passa == 1 and ((turn % 2 == 0 and userRequest == current_game.username1) or (turn % 2 == 1 and userRequest == current_game.username2)):
           finish_game(number,current_game,1)
           data = win_type(number)
           return data
        else:
           passa = 1
           if turn % 2 == 0 and userRequest == current_game.username1:
               timer = update_timers(current_game.timer1, current_game.time1)
               Gaming.objects.filter(hash_code__iexact=number).update(id_move = turn + 1, time2 = time.time(), pass_flag = passa, timer1 = timer)
           elif turn % 2 == 1 and userRequest == current_game.username2:
               timer = update_timers(current_game.timer2, current_game.time2)
               Gaming.objects.filter(hash_code__iexact=number).update(id_move = turn + 1, time1 = time.time(), pass_flag = passa, timer2 = timer)
    else:
        data = win_type(number)
    return data


#Called when a user surrenders
@database_sync_to_async
def update_surrender(userRequest, number):
    cg = Gaming.objects.filter(hash_code__iexact=number)
    data = {}
    if cg:
        current_game = cg[0]
        if userRequest == current_game.username1:
           current_game.id_move = 0          
        elif userRequest == current_game.username2:
           current_game.id_move = 1        
        finish_game(number,current_game,3)
        data = win_type(number)
    return data

#Calculate new elo for both users
def update_elo(elo_win, elo_lose):
   k = 32
   e_win = 1/(1 + pow(10,((elo_lose - elo_win)/400)))
   e_lose = 1/(1 + pow(10,((elo_win - elo_lose)/400))) 
   new_elo_win = elo_win + int(k * (1 - e_win))
   new_elo_lose = elo_lose + int(k * (0 - e_lose))
   return new_elo_win, new_elo_lose

#Called when game is finished, updates users statistics and create history entry in database
def finish_game(number,current_game,victory):
    history_exists = History.objects.filter(Q(hash_code__iexact=current_game.hash_code)
        &(Q(winner=current_game.username1) | Q(winner=current_game.username2)) & (Q(loser=current_game.username1) | Q(loser=current_game.username2)))
    if not history_exists:
        win2 = CustomUser.objects.filter(username__iexact=current_game.username2)[0].win
        lose2 = CustomUser.objects.filter(username__iexact=current_game.username2)[0].lose
        best2 = CustomUser.objects.filter(username__iexact=current_game.username2)[0].best_elo                     
        win1 = CustomUser.objects.filter(username__iexact=current_game.username1)[0].win
        lose1 = CustomUser.objects.filter(username__iexact=current_game.username1)[0].lose
        best1 = CustomUser.objects.filter(username__iexact=current_game.username1)[0].best_elo                                      
        if (current_game.id_move % 2 == 0 and victory >= 2) or (current_game.score2 > current_game.score1 and victory == 1):
            win2 += 1
            lose1 += 1 
            winrate1 = round(((win1/(win1 + lose1))*100),1)
            loserate1 = round(((lose1/(win1 + lose1))*100),1)
            winrate2 = round(((win2/(win2 + lose2))*100),1)
            loserate2 = round(((lose2/(win2 + lose2))*100),1)  
            elo2, elo1 = update_elo(current_game.elo2, current_game.elo1)
            if(elo2 > best2):
                best2 = elo2
            CustomUser.objects.filter(username__iexact=current_game.username1).update(elo=elo1, lose=lose1, winrate=winrate1, loserate=loserate1)
            CustomUser.objects.filter(username__iexact=current_game.username2).update(elo=elo2, win=win2, winrate=winrate2, loserate = loserate2, best_elo =best2)
            history = History(winner=current_game.username2, loser=current_game.username1, hash_code = current_game.hash_code, victory=victory)
            history.save()
        elif (current_game.id_move % 2 == 1 and victory >= 2) or (current_game.score1 > current_game.score2 and victory == 1):
            win1 += 1
            lose2 += 1
            winrate1 = round(((win1/(win1 + lose1))*100),1)
            loserate1 = round(((lose1/(win1 + lose1))*100),1)
            winrate2 = round(((win2/(win2 + lose2))*100),1)
            loserate2 = round(((lose2/(win2 + lose2))*100),1)  
            elo1, elo2 = update_elo(current_game.elo1, current_game.elo2)
            if(elo1 > best1):
                best1 = elo1
            CustomUser.objects.filter(username__iexact=current_game.username1).update(elo=elo1, win=win1, winrate=winrate1, loserate=loserate1, best_elo = best1)
            CustomUser.objects.filter(username__iexact=current_game.username2).update(elo=elo2, lose=lose2, winrate=winrate2, loserate = loserate2)
            history = History(winner=current_game.username1, loser=current_game.username2, hash_code = current_game.hash_code, victory=victory)
            history.save()
        Gaming.objects.filter(hash_code__iexact=number).delete()

#Return message for users based on type of victory (time,points,surrender)
def win_type(number):
    message = ""
    history = History.objects.filter(hash_code__iexact=number)[0]
    if history.victory == 3:
        message = history.loser + " gave up, wins " + history.winner
    elif history.victory == 2:
        message = "Time out, wins: " + history.winner
    elif history.victory == 1:
        message = "Wins on points: " + history.winner
    data = {'winner' : message, 'victory' : history.victory, 'player' : history.winner}
    return data
