
import React, { Component } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, Picker} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import Panel from 'react-native-panel';
import { Table, Row } from 'react-native-table-component';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
var {vw,vh,vmin,vmax} = require('react-native-viewport-units');
import PieChart from 'react-native-pie-chart';


const IP = "192.168.178.122:8000";

export default class Welcome extends Component {
  constructor(props){
    super(props);
    var ws;
    this.state ={ 
      username: this.props.navigation.state.params.username,
      elo : '',
      nationality : '',
      win: '',
      lose: '',
      winrate: '',
      loserate: '',
      best_elo: '',
      tableHead: [],
      tableMatchesHead: [],
      winners: [],
      losers: [],
      in_game: '0',
      time: '9x9',
      dim: '3min',
      playername: '',
      myplayername: '',
      randomize: '',
      invioPlayer: '',
      invioRandom: '',
      refuse: '',
      sendRequest: '',
      messaggio: "",
      queueUsername : [],
      playerNameValid: true,
      queueElo : [],
      queueDim : [],
      queueTime : [],
      refresh: true,
      connectionState : true,
    };
  }

  componentDidMount(){
    this.getStats();
    this.webSocketHandler();
  }

  //Send request to server to get user statistics
  getStats(){ 
    fetch('http://' + IP + '/gogoapp/welcome/get_statistics?username=' + this.state.username)
    .then((response) => response.json())
    .then(data => {
      this.setState({elo : data.elo, nationality: data.nationality, win: data.win, lose : data.lose,
        winrate : data.winrate, loserate: data.loserate, best_elo: data.best_elo, tableHead: ["Winner","Loser"],
        tableMatchesHead:["Elo","Size","Time","You dare?"],winners: data.winners, losers: data.losers, in_game : data.in_game});
      })
    .catch((error) =>{
      alert("No connection to the serverino");
    });
    if(this.state.in_game != '0'){
      const { navigate } = this.props.navigation;
      const hash_code = this.state.in_game;
      this.goToGame(hash_code);
    }
  }

  //Start websocket and listener
  webSocketHandler(){
    const { navigate } = this.props.navigation;
    this.ws = new WebSocket('ws://' + IP + '/ws/gogoapp/welcome/' + this.state.username + '/');

    this.ws.onmessage = (evt) => {
      const d = JSON.parse(evt.data)
      const data = d.data;
      if(data.queueUsername){
        this.setState({ queueUsername: data.queueUsername, queueElo: data.queueElo, queueDim : data.queueDim, queueTime : data.queueTime})
      }
      else if(data.hash_code){
        this.goToGame(data.hash_code);
      }
      else if(data.refuse){
        this.setState({invioPlayer : ''});
        alert(data.refuse);        
      }
    };

    this.ws.onclose = (evt) => {
      this.setState({connectionState : false});
      alert("No connection to the server");
    };
  }

  //Redirect to game given hash_code of match
  goToGame(hash_code){
    this.setState({refresh: false, invioPlayer: '', invioRandom: '', in_game : ''});
    this.props.navigation.replace('Game', {username : this.state.username, hash_code: hash_code });
  }

  //Logout removing saved credentials
  async logout(){
    await AsyncStorage.removeItem(CREDENTIALS);
    this.setState({refresh: false});
    this.props.navigation.replace('Home');
  }

  //Send a game request to server (random or custom)
  searchGame(){
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username : this.state.username , elo: this.state.elo,  time: this.state.time, dim: this.state.dim, playername: this.state.playername  })
    };
    if(this.state.playername == '' && this.state.connectionState){
      this.setState({invioRandom : 'Searching for an opponent..', invioPlayer: '', messaggio: ''});
    }
    fetch('http://' + IP + '/gogoapp/welcome/create_game', requestOptions)
    .then(response => response.json())
    .then(data => this.startGame(data))
    .catch((error) =>{
      alert("No connection to the server");
    });
  }

  //Check if a game is found
  startGame(data){   
    if(data.hash_code){
      this.goToGame(data.hash_code);
    }
    else if(data.error){
      alert(data.error);
    }
    else if(data.message){
      this.setState({messaggio: data.message, invioRandom: '', invioPlayer: ''});
      alert(this.state.messaggio);
    }
    else if(data.invioPlayer){
      this.ws.send(JSON.stringify({
        'code' : 0,
        'playername': this.state.playername
      }));
      this.setState({invioPlayer: data.invioPlayer, messaggio: ''});
    }
  }

  //Tell server to accept game request from certain user
  accept(i){
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.state.username, elo: this.state.elo, playername: this.state.queueUsername[i] })
    };
    fetch("http://" + IP + "/gogoapp/welcome/accept_game", requestOptions)
    .then(response => response.json())
    .then(data => {
      this.ws.send(JSON.stringify({
        'code' : 1,
        'playername': this.state.queueUsername[i],
      }));
      this.startGame(data);
    });
  }

  //Tell server to refuse game request from certain user
  refuse(i){
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.state.username, playername: this.state.queueUsername[i] })
    };
    fetch("http://" + IP + "/gogoapp/welcome/refuse_game", requestOptions)
    .then(response => response.json())
    .then(data => {
      this.ws.send(JSON.stringify({
        'code' : 2,
        'playername': this.state.queueUsername[i],
      }));
      this.ws.send(JSON.stringify({
        'code' : 0,
        'playername': this.state.username,
      }));
    });
  }

  // GRAPHIC FUNCTIONS

  showPieChart(){
    const chart_wh = 130;
    const series = [parseInt(this.state.winrate),parseInt(this.state.loserate)];
    const sliceColor = ['#00FF00','#FF0000'];
    return(
      <PieChart
        chart_wh={chart_wh}
        series={series}
        sliceColor={sliceColor}
        doughnut={true}
        coverRadius={0.45}
        coverFill={'#252525'}
      />
    );
  }

  Match(props){
    var rowMatch = [];
    const dareButton = () => (
      <View style={styles.row}>
        <TouchableOpacity style={styles.accept} onPress={props.onPress1}>
          <Image
            source={require("../img/accept.png")}
            resizeMode="contain"
            style={[styles.imageBackground, styles.left]}
          >
          </Image>  
        </TouchableOpacity>
        <TouchableOpacity style={styles.reject} onPress={props.onPress2}>
          <Image
            source={require("../img/reject.png")}
            resizeMode="contain"
            style={[styles.imageBackground,styles.right]}
          >
          </Image>  
        </TouchableOpacity>
      </View>
    );
    rowMatch.push(props.elo);
    rowMatch.push(props.dim);
    rowMatch.push(props.time);
    rowMatch.push(dareButton());
    return(
      <Row data={rowMatch} style={styles.winner} textStyle={[styles.helloText, styles.little, styles.center]}/>
    );
  }

  createMatch(i){
    return(
      <this.Match
        id = {i}
        elo={this.state.queueElo[i]}
        dim={this.state.queueDim[i]}
        time={this.state.queueTime[i]}
        onPress1={() => this.accept(i)}
        onPress2={() => this.refuse(i)}
      />
    );
  }

  showMatch(i){
    return(
      <View>
        <Table borderStyle={styles.tableBorder}>
          <Row data={this.state.tableMatchesHead} style={styles.head} textStyle={[styles.helloText, styles.medium, styles.center]}/>
            {this.createMatch(i)}        
        </Table>
      </View>
    );
  }



  createPanel(i){
    const sfidante = "Challenger: " + this.state.queueUsername[i];
    return(
      <Panel 
        style={styles.window}
        header={sfidante}>
        <View>
          {this.showMatch(i)}
        </View>
      </Panel>
    );
  }


  showMatchesPanel(){
    let x = [];
    for(var i = 0; i < this.state.queueUsername.length; i++){
      x.push(this.createPanel(i));
    }
    return x;  
  }

  

  showGame(i){
    var lastGame = [];
    lastGame.push(this.state.winners[i]);
    lastGame.push(this.state.losers[i]);
    return(
      <Row data={lastGame} style={styles.winner} textStyle={[styles.helloText, styles.little, styles.center]}/>
    );
  }

  showGames(){
    let x = [];
    for(var i = 0; i < this.state.winners.length; i++){
      x.push(this.showGame(i));
    }
    return x;
  }

  showLast10Games(){
    return(
      <View>
        <Table borderStyle={styles.tableBorder}>
          <Row data={this.state.tableHead} style={styles.head} textStyle={[styles.helloText, styles.medium, styles.center]}/>
          {this.showGames()}     
        </Table>
      </View>
    );
  }

  showNotifications(){
    return(
      <View style={{margin : vh}}>
        <Text style={[styles.helloText, styles.medium, styles.center]}>{this.state.invioRandom}</Text>
        <Text style={[styles.helloText, styles.medium, styles.center]}>{this.state.invioPlayer}</Text>
      </View>
    );
  }

  render() {  
    return (
      <View style={styles.root}>
        <KeyboardAwareScrollView style={styles.scroll}>
          <View style={[styles.window, styles.rowFlex]}>
            <View>
              <Text style={[styles.helloText, styles.big]} > Hi {this.state.username} </Text>
              <Text style={[styles.helloText, styles.medium]} > Elo : {this.state.elo} </Text>
              <Text style={[styles.helloText, styles.medium]}> Nationality : {this.state.nationality} </Text>
              <Text style={[styles.helloText, styles.medium]}> Total victories : {this.state.win} </Text>
              <Text style={[styles.helloText, styles.medium]}> Total defeats : {this.state.lose} </Text>
              <Text style={[styles.helloText, styles.medium]}> Best Elo : {this.state.best_elo} </Text>
              <TouchableOpacity style={styles.button} onPress={() => this.logout()}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
            <View styles={styles.window}>
              <Text style={[styles.helloText, styles.little]}></Text>
              {this.showPieChart()}
              <View style={styles.percentage}>
                <View style={styles.greenRect}></View>
                <Text style={[styles.helloText, styles.little]}> Winrate {this.state.winrate}% </Text>
              </View>
              <View style={styles.percentage}>
                <View style={styles.redRect}></View>
                <Text style={[styles.helloText, styles.little]}> Loserate {this.state.loserate}% </Text>
              </View>              
              </View>
            </View>
            <Panel 
              style={styles.window}
              header="Last 10 Games">
              <View>
                {this.showLast10Games()}
              </View>
            </Panel>

            <View>
              {this.showMatchesPanel()}
            </View>

            <View style={styles.window}>
              <View style={styles.pickerView}>
                <Text style={[styles.helloText, styles.medium, styles.center]} > Select Goban Size </Text>
                <Picker
                  style={styles.picker}
                  selectedValue={this.state.dim}
                  onValueChange={(itemValue) => this.setState({dim : itemValue })}
                >
                  <Picker.Item label="9x9" color="#CCCCCC" value="9x9" />
                  <Picker.Item label="13x13" color="#CCCCCC" value="13x13" />
                  <Picker.Item label="19x19" color="#CCCCCC" value="19x19" />
                </Picker>
              </View>
              <View style={styles.pickerView}>
                <Text style={[styles.helloText, styles.medium, styles.center]} > Select Time for each player </Text>
                <Picker
                  selectedValue={this.state.time}
                  style={styles.picker}
                  onValueChange={(itemValue) => this.setState({time : itemValue })}
                  itemStyle={{color : "#CCCCCC"}}
                >
                  <Picker.Item label="3min" color="#CCCCCC" value="3min" />
                  <Picker.Item label="10min" color="#CCCCCC" value="10min" />
                  <Picker.Item label="30min" color="#CCCCCC" value="30min" />
                  <Picker.Item label="60min" color="#CCCCCC" value="60min" />
                </Picker>
              </View>
              <Text style={[styles.helloText, styles.medium, styles.center]} > Insert a name to send a request to a friend </Text>
              <Text style={[styles.helloText, styles.medium, styles.center]} > Ignore this field if you want a random opponent </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter player name"
                placeholderTextColor="#CCCCCC"
                onChangeText={(text) => this.setState({playername: text })} 
              />

              <TouchableOpacity style={styles.button} onPress={() => this.searchGame()}>
                <Text style={styles.buttonText}>Play</Text>
              </TouchableOpacity>            
              {this.showNotifications()}
            </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#595959',
    width:"100%",
    height:"100%",
  },
  scroll: {
    backgroundColor: '#595959',
  },
  window: {
    backgroundColor: '#252525',
    width: "95%",
    margin: 2*vh,
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: 4,
  }, 
  rowFlex:{
    flex: 1,
    flexDirection: "row",
  }, 
  windowRow:{
    flex: 1,
    flexDirection: "row",
    backgroundColor: '#252525',
    width: "95%",
    margin: 2*vh,
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: 4,
  },
  windowColumn:{
    backgroundColor: '#252525',
    width: "95%",
    margin: 2*vh,
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: 4,
  },
  button: {
    margin: 15,
    backgroundColor: "#800000",
    borderRadius: 4,
    height: 4*vh,
    width: 40*vw,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: "center",
  },
  buttonText: {
    fontSize: 18,
    fontFamily: `Courier`,
    fontWeight: `1000`,
    fontStyle: `normal`,
    color: '#FFFFFF',
  },
  percentage: {
    flex: 1,
    flexDirection: "row",
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenRect:{
    width: 4*vw,
    height: 4*vw,
    backgroundColor: '#00FF00',
    borderColor: "#000000",
    borderWidth: 1,
  },
  redRect:{
    width: 4*vw,
    height: 4*vw,
    backgroundColor: '#FF0000',
    borderColor: "#000000",
    borderWidth: 1,
  },
  accept: {
    width: 8*vw,
    height: 8*vw,
    borderRadius:50,
    backgroundColor:'transparent',
    opacity: 1,
    marginLeft: 10
  },
  reject: {
    width: 8*vw,
    height: 8*vw,
    borderRadius:50,
    backgroundColor:'transparent',
    opacity: 1,
    marginRight: 10
  },
  table:{
    width: "100%",
    paddingTop: 2*vh,
  },
  tableBorder:{
    borderWidth: 3,
  },
  tableWrapper:{
    flexDirection: "row",
  },
  head:{
    height: 6*vh,
    textAlign: "center",
    backgroundColor: "#800000"
  },
  winner:{
    height: 4*vh,
    textAlign: "center",
  }, 
  loser:{
    backGroundColor: "#F44336",
    height: 4*vh,
    flex: 1,
  },
  text:{
    margin: 5.1*vh,
    textAlign: "center",
  },
  text2:{
    backGroundColor: "#800000",
    margin: 5.1*vh,
    textAlign: "center",    
  },
  row: {
    backgroundColor:'#252525',
    flexDirection: 'row',
    flex: 1 ,
  },
  imageBackground: { 
    backgroundColor:'#252525',
    width: "100%",
    height: "100%",   
    opacity: 1,
  },
  left:{
    marginLeft : 0,
  },
  right:{
    marginRight : 0,
  },
  picker: {
    margin: 2*vh,
    width: "50%",
    borderColor: "#595959",
    alignSelf: "center",   
  },  
  pickerView: {
    margin: 2*vh,
  },
  textInput: {
    margin: 5,
    padding: 5,
    width: "90%",
    borderColor: "#CCCCCC",
    color: "#CCCCCC",
    alignSelf: "center",
    borderWidth: 2,
  },
  helloText: {
    color: "#CCCCCC",
    textAlignVertical: `center`,
    fontFamily: `Courier`,
    fontWeight: `700`,
    fontStyle: `normal`
  },
  big: {
    fontSize : 25,
  },
  medium: {
    fontSize : 15,
  },
  little: {
    fontSize : 12,
  },
  center: {
    alignSelf: "center",
  },
  statsText:{
    color: "#CCCCCC",
    textAlignVertical: `center`,
    fontFamily: `Courier`,
    fontWeight: `700`,
    fontStyle: `normal`
  },
});
  
export const CREDENTIALS = 'credentials';

