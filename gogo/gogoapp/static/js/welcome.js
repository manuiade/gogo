/***************************************************************************************************
                                           REACT WELCOME PAGE
 **************************************************************************************************/

const IP = "192.168.178.105:8000";

//Welcome class
class Welcome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username : data.username,      
      elo : '',
      nationality: '',
      win : '',
      lose : '',
      winrate : '',
      loserate : '',
      best_elo : '',
      dim: '',
      time: '',
      playername: '',
      randomize: '',
      invioRandom: '',
      invioPlayer: '',
      messaggio: '',
      winners : [],
      losers : [],
      queueUsername : [],
      queueElo : [],
      queueDim : [],
      queueTime : [],
    };
  }

  logout(){
    fetch(window.location.href = "logout");
  }

  //redirect to game page if game is found
  renderRedirect(data){
    if(data.hash_code){
      const game = "game/" + data.hash_code;
      fetch(window.location.href = game);
    }
    else if(data.message){
      this.setState({messaggio: data.message, invioRandom: '', invioPlayer: ''});
      alert(this.state.messaggio);
    }
    else if(data.invioPlayer){
      this.connection.send(JSON.stringify({
        'code' : 0,
        'playername': this.state.playername
      }));
      this.setState({invioPlayer: data.invioPlayer, messaggio: ''});
    }
  }
 
  //send create game request (random or custom)
  createGame(){
    if(this.state.playername == ''){
      this.setState({invioPlayer: '', messaggio: '', invioRandom : "Searching an opponent..."});
    }
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.state.username, elo: this.state.elo, time: this.state.time, dim: this.state.dim, playername : this.state.playername })
    };
    fetch(window.location.href + "/create_game", requestOptions)
      .then(response => response.json())
      .then(data => this.renderRedirect(data));  
  }

  //accept i-th game
  handleClick(i){
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.state.username, elo: this.state.elo, playername: this.state.queueUsername[i] })
    };
    fetch(window.location.href + "/accept_game", requestOptions)
      .then(response => response.json())
      .then(data => {
        this.connection.send(JSON.stringify({
          'code' : 1,
          'playername': this.state.queueUsername[i],
        }));
        this.renderRedirect(data);
      });
  }

  //refuse i-th game
  refuse(i){
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.state.username, playername: this.state.queueUsername[i] })
    };
    fetch(window.location.href + "/refuse_game", requestOptions)
      .then(response => response.json())
      .then(data => {
        this.connection.send(JSON.stringify({
          'code' : 2,
          'playername': this.state.queueUsername[i],
        }));
        this.connection.send(JSON.stringify({
          'code' : 0,
          'playername': this.state.username,
        }));
      });
  }

  /**************************************************** Queue games render ******************************************/
  Queue(props){
    return(
      <div>
        <window.MaterialUI.TableRow>
          <td className="tdQ" id="td" colSpan="1"></td>
          <window.MaterialUI.TableCell className="col-button">
            <button className="accept"  onClick={props.onClick1}>{}</button>
            <button className="refuse" onClick={props.onClick2}>{}</button>
          </window.MaterialUI.TableCell>
          <td className="tdQ" id="td" colSpan="2"></td>
          <window.MaterialUI.TableCell className="col-user">{props.username}</window.MaterialUI.TableCell>
          <td className="tdQ" id="td" colSpan="3"></td>
          <window.MaterialUI.TableCell className="col-elo">{props.elo}</window.MaterialUI.TableCell>
          <td className="tdQ" id="td" colSpan="4"></td>
          <window.MaterialUI.TableCell className="col-time">{props.time}</window.MaterialUI.TableCell>
          <td className="tdQ" id="td" colSpan="5"></td>
          <window.MaterialUI.TableCell className="col-dim">{props.dim}</window.MaterialUI.TableCell>
          <td className="tdQ" id="td" colSpan="6"></td>
        </window.MaterialUI.TableRow>
      </div>
    );
  }

  createQueue(i){
    return(
      <this.Queue
        id = {i}
        username={this.state.queueUsername[i]}
        elo={this.state.queueElo[i]}
        time={this.state.queueTime[i]}
        dim={this.state.queueDim[i]}
        onClick1={() => this.handleClick(i)}
        onClick2={() => this.refuse(i)}
      />
    );
  }

  QueueCustomGames(){
    let x = [];
    for(var i = 0; i < this.state.queueUsername.length; i++){
       x.push(this.createQueue(i));
    }
    return x;
  }

  printQueueCustomGames(){
   return (
    <div>
     <window.MaterialUI.TableContainer>
      <window.MaterialUI.Table className="tableQ">
        <window.MaterialUI.TableHead className="headQ">
          <window.MaterialUI.TableRow className="head-rowQ">
            <td className="tdQ" id="td" colSpan="1"></td>
            <window.MaterialUI.TableCell className="head-button">You dare?</window.MaterialUI.TableCell>
            <td className="tdQ" id="td" colSpan="2"></td>
            <window.MaterialUI.TableCell className="head-user">Challenger</window.MaterialUI.TableCell>
            <td className="tdQ" id="td" colSpan="3"></td>
            <window.MaterialUI.TableCell className="head-elo">Elo</window.MaterialUI.TableCell>
            <td className="tdQ" id="td" colSpan="4"></td>
            <window.MaterialUI.TableCell className="head-time">Time</window.MaterialUI.TableCell>
            <td className="tdQ" id="td" colSpan="5"></td>
            <window.MaterialUI.TableCell className="head-dim">Size</window.MaterialUI.TableCell>
            <td className="tdQ" id="td" colSpan="6"></td>
          </window.MaterialUI.TableRow>
        </window.MaterialUI.TableHead>
        <window.MaterialUI.TableBody>
          <div> {this.QueueCustomGames()} </div> 
        </window.MaterialUI.TableBody>
      </window.MaterialUI.Table>
     </window.MaterialUI.TableContainer>
    </div>
   );
  }
  /***********************************************************************************************************************/

  /********************************************** Last 10 games render ***************************************************/
  Games(props){
    return(
      <div>
        <window.MaterialUI.TableRow className="body-row">
          <td className="td" id="td" colSpan="1"></td>
          <window.MaterialUI.TableCell className="body-row-item">{props.winner}</window.MaterialUI.TableCell>
          <td className="td" id="td" colSpan="2"></td>
          <window.MaterialUI.TableCell className="body-row-item">{props.loser}</window.MaterialUI.TableCell>
          <td className="td" id="td" colSpan="3"></td>
        </window.MaterialUI.TableRow>
      </div>
    );
  }

  createGames(i){
    return(
      <this.Games
        id = {i}
        winner={this.state.winners[i]}
        loser={this.state.losers[i]}
      />
    );
  }

  last10Games(){
    let x = [];
    for(var i = 0; i < this.state.winners.length; i++){
      if(this.state.winners[i] == ""){
        break;
      }
      x.push(this.createGames(i));
    }
    return x;
  }

  printLast10Games(){
    return (
      <div>
        <window.MaterialUI.TableContainer>
          <window.MaterialUI.Table className="table">
            <window.MaterialUI.TableHead className="head">
              <window.MaterialUI.TableRow className="head-row">
                <td className="td" id="td" colSpan="1"></td>
                <window.MaterialUI.TableCell className="head-row-item">Winner</window.MaterialUI.TableCell>
                <td className="td" id="td" colSpan="2"></td>
                <window.MaterialUI.TableCell className="head-row-item">Loser</window.MaterialUI.TableCell>
                <td className="td" id="td" colSpan="3"></td>
              </window.MaterialUI.TableRow>
            </window.MaterialUI.TableHead>
            <window.MaterialUI.TableBody  className="body">
              <div> {this.last10Games()} </div> 
            </window.MaterialUI.TableBody>
          </window.MaterialUI.Table>
        </window.MaterialUI.TableContainer>
      </div>
    );
  }
  /***************************************************************************************************************************/

  /************************************************ User statistics render (and doughnut) ************************************/
  createMessageGame(){
    let mess = '';
    if(this.state.invioRandom != ''){
      mess = this.state.invioRandom;
      return mess;
    }
    if(this.state.invioPlayer != ''){
      mess = this.state.invioPlayer;
      return mess;
    }
    return mess;
  }
   
  createDoughnut(){
    if(this.state.winrate + this.state.loserate != 0){
      var DoughnutChart = window['reactChartjs2'].Doughnut;
      var data = {
        datasets: [{
          data: [this.state.loserate, this.state.winrate],
          backgroundColor: [ 'red' ,'green'],
          hoverBackgroundColor: ['#ff3333','#66ff33'],
        }],
        labels: ['loserate','winrate']
      };
      return(
        <div className="doughnut">
          <DoughnutChart data={data} width={100} height={100} />
        </div>
      );
    }
    else {
      return <div></div>
    }
  }

  getStats(){
    fetch(window.location.href + "/get_statistics?username=" + this.state.username)
      .then((response) => response.json())
      .then(data => {
        this.setState({elo : data.elo, nationality: data.nationality, win: data.win, lose : data.lose, winrate : data.winrate, loserate: data.loserate, best_elo: data.best_elo, winners: data.winners, losers: data.losers});
      })
      .catch((error) =>{
        alert("No connection to the server");
      });
  }
  /********************************************************************************************************************************/

  /******************************************************** Connect web socket ****************************************************/
  componentDidMount(){
    this.getStats();
    this.connection = new WebSocket('ws://'+ IP + '/ws/gogoapp/welcome/' + data.username + '/');    
    this.connection.onmessage = evt => { 
      const d = JSON.parse(evt.data)
      const data = d.data;
      if(data.queueUsername){
        this.setState({ queueUsername: data.queueUsername, queueElo: data.queueElo, queueDim : data.queueDim, queueTime : data.queueTime})
      }
      else if(data.hash_code){
        this.renderRedirect(data);
      }
      else if(data.refuse){
        this.setState({invioPlayer : ''});
        alert(data.refuse);        
      }
    };   
  }

  render() {
    const username = "Hi " + this.state.username + "!";
    const elo = "Elo: " + this.state.elo;
    const nation = "Nationality: " + this.state.nationality;
    const win = "Total victories: " + this.state.win;
    const lose = "Total defeats: " + this.state.lose;
    const best_elo = "Best elo: " + this.state.best_elo;
    const last_games = "Last 10 Games";
    const invite = "Game Requests";
    const create = "Create game";
    const dim = "Select Goban size";
    const dim9 = "9x9";
    const dim13 = "13x13";
    const dim19 = "19x19";
    const time = "Select Time for each player";
    const time3 = "3 min";
    const time10 = "10 min";
    const time30 = "30 min";
    const time60 = "60 min";
    const playerName = "Insert a name to send a request to a friend";
    const randomName = "Ignore this field if you want a random opponent";

    return (
      <div className="root">
        <div className="top">
          <div className="hello">
            <h1 className="display-4">{username}</h1>
            <h4 className="display-4">{elo} </h4>
            <h4 className="display-4">{nation} </h4>
            <div className="custom-button">
              <button id="logout" className="logout" onClick={() => this.logout()}>Logout</button>
            </div>
          </div>
          <div className="statistics">
            <div className="stats-text">
              <h1 className="display-stat">Statistics</h1> 
              <h4 className="display-1"> {win} </h4>
              <h4 className="display-1"> {lose} </h4>
              <h4 className="display-1"> {best_elo} </h4>
            </div> 
            <div>{this.createDoughnut()}</div>   
          </div>
        </div>
        <div className="down">
          <div className="last">
            <h1 className="last-games">{last_games}</h1>
            <div className="printLast"> 
              {this.printLast10Games()} 
            </div>
          </div>
          <div className="queue">
            <h1 className="invited">{invite}</h1>
            <div className="printQueue"> 
              {this.printQueueCustomGames()} 
            </div>
          </div>
          <div className="form">
            <div className="search"> {create}</div>
            <h1 className="dim">{dim}</h1>
            <div className="custom-dropdown">
              <select name="dim" className="custom-text" required="true" onChange={(e) => this.setState({ dim: e.target.value })}>
                <option value="9x9">{dim9}</option>
                <option value="13x13">{dim13}</option>
                <option value="19x19">{dim19}</option>
              </select>
            </div>
            <h1 className="time">{time}</h1>
            <div className="custom-dropdown">   
              <select name="time" className="custom-text" required="true" onChange={(e) => this.setState({ time: e.target.value })}>
                <option value="3min">{time3}</option>
                <option value="10min">{time10}</option>
                <option value="30min">{time30}</option>
                <option value="60min">{time60}</option>
              </select>
            </div>  
            <h1 className="label-player">{playerName}</h1>
            <h1 className="label-player">{randomName}</h1>
            <input type="text" className="custom-player" name="playerName" placeholder="Enter player name" maxlength="50" id="player_name"
              onChange={(e) => this.setState({ playername: e.target.value })}/>
            <h1 className="create-game">{this.createMessageGame()}</h1>
            <div className="custom-button">
              <button id="play" className="play" onClick={() => this.createGame()}>Play</button> 
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Welcome />, document.getElementById('welcome'));
