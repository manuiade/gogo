import React, { Component } from 'react';
import {StyleSheet, View, Text, Image, ImageBackground, TouchableOpacity, ScrollView} from 'react-native';
import ReactNativeZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';

import BackgroundTimer from 'react-native-background-timer';

var {vw,vh,vmin,vmax} = require('react-native-viewport-units');

import { Table, TableWrapper, Row, Col } from 'react-native-table-component';
import Dialog from 'react-native-dialog';

const IP = "192.168.178.122:8000";
	
export default class Game extends Component {
	constructor(props){
  	super(props);
  	var styleCell = styles.button9;
  	var image = "";
  	var ws;
  	this.state ={ 
  		username: this.props.navigation.state.params.username,
    	hash_code: this.props.navigation.state.params.hash_code,
    	next_player : '',
    	username1 : '',
    	username2 : '',
    	elo1 : '',
    	elo2 : '',
    	moves : "",
    	timer1 : '',
    	timer2 : '',
    	score1 : '',
    	score2 : '',
    	pedine1 : '',
    	pedine2 : '',
    	id_move : '',
    	dim : '',
    	error : "",
    	winner : "",
    	isHover: -1,
    	tableHead: [],
    	tablePlayer1: [],
    	tableStats: [],
    	tablePlayer2: [],
    	surrenderDialog: false,
    	surrendati: false,
    	finishDialog: false,
    	finish: false,
    	ritorna: false,
  	};
  }

	//get game status and start websocket connection and listeners
	componentDidMount(){
  	fetch('http://' + IP + '/gogoapp/game/' + this.state.hash_code + '/get_params?username=' + this.state.username)
    .then((response) => response.json())
   	.then(data => {
    	this.setState({username1: data.username1, username2: data.username2, elo1: data.elo1, elo2: data.elo2,
      	timer1: data.current_timer1, timer2: data.current_timer2,
        dim: data.dim, next_player : data.next_player, moves: data.moves, score1 : data.score1, score2 : data.score2,
        pedine1 : data.pedine1, pedine2: data.pedine2, id_move : data.id_move })
    	})
    .catch((error) =>{
    	alert("No connection to the server");
    });
    this.setState({tableHead: [this.state.username1, 'Player', this.state.username2],
    	tablePlayer1: [this.state.elo1, this.state.score1, this.state.pedine1 ],
      tableStats: ['Elo', 'Score', 'Stones left'],
      tablePlayer2: [this.state.elo2, this.state.score2, this.state.pedine2]
    });
    this.ws = new WebSocket('ws://' + IP + '/ws/gogoapp/game/' + this.state.username + '/' + this.state.hash_code + '/');
    this.ws.onmessage = evt => { 
    	const d = JSON.parse(evt.data)
      const data = d.data;
      if(data.moves){
      	this.setState({ next_player : data.username, moves: data.moves, score1 : data.score1, score2 : data.score2,
          pedine1 : data.pedine1, pedine2: data.pedine2, id_move : data.id_move})
        if(this.state.timer1 > 1){
          this.setState({timer1 : data.timer1})
        }
        else{
          this.setState({timer1 : 0})
        }
        if(this.state.timer2 > 1){
          this.setState({timer2 : data.timer2})
        }
        else{
          this.setState({timer2 : 0})
        }
      }
      else if(data.error){
      	alert(data.error);
      }
      else if(data.winner){       
      	this.setState({winner : data.winner,finish : true})
          finish = true;
        if(data.victory == 2){
          
          if(data.player == this.state.username1){
            this.setState({timer2 : 0})
          }
          else if(data.player == this.state.username2){
            this.setState({timer1 : 0})
          }
        }
      }
    };
		this.interval = BackgroundTimer.setInterval(() => this.update(), 950);
  }

	//decrement time based on turn and check when a timer reaches 0
	update(){   
  	if(this.state.winner == ""){
      var timer1 = 0;
      var timer2 = 0;
			if(this.state.id_move % 2 == 0){
      	if(this.state.timer1 > 0){
          timer1 = this.state.timer1 - 1;
        }
        if(timer1 <= 0){
        	timer1 = 0;
          this.ws.send(JSON.stringify({
          	'code' : 1
          }));
        }
        
        this.setState({timer1:timer1});
        
      }
      else{
      	if(this.state.timer2 > 0){
          timer2 = this.state.timer2 - 1;
        }
        if(timer2 <= 0){
        	timer2 = 0;
          this.ws.send(JSON.stringify({
          	'code' : 1
          }));
        }
        this.setState({timer2:timer2});
        
      }
      this.setState({tableHead: [this.state.username1, 'Player', this.state.username2],
      	tablePlayer1: [this.state.elo1, this.state.score1, this.state.pedine1 ],
      	tableStats: ['Elo', 'Score', 'Stones left'],
      	tablePlayer2: [this.state.elo2, this.state.score2, this.state.pedine2]
      });
      this.surrender();
    }        
    else{
    	this.exitGame();
    }    
  }

	//return to welcome page
	exitGame(){
  	if(this.state.ritorna){
			this.setState({next_player : '', username1 : '', username2 : '', elo1 : '', elo2 : '',
				moves : "", timer1 : '', timer2 : '', score1 : '', score2 : '', pedine1 : '', pedine2 : '',id_move : '',
				dim : '', error : "", winner : "", isHover: -1, tableHead: [], tablePlayer1: [], tableStats: [], tablePlayer2: [],
				surrenderDialog: false,surrendati: false,finishDialog: false,finish: false,ritorna: false
			});
      this.props.navigation.replace('Welcome', {username : this.state.username});
		}
	}

	//show next player or winner
  getNextPlayer(){
    var gameStatus = "";
    if(!this.state.finish){
       gameStatus = "Next player : " + this.state.next_player;
    }
    else{
       gameStatus = this.state.winner;
    }
    return gameStatus;
	}
	
	//send to server move selected
	sendMove(i,j){
		const moves = this.state.moves.slice();
		if(this.state.winner==""){
			this.ws.send(JSON.stringify({
				'code' : 0, id : parseInt(parseInt(i)*parseInt(this.state.dim)+parseInt(j)) , username : this.state.username
			}));
		}
 }
 
 	//update goban if moves is valid or show error if move is invalid
	setTurn(data,i,j){
		if(data.moves){
			this.setState({moves: data.moves, error : "" });
			image = this.getImage(i * this.state.dim + j);
			this.setState({flag : 0})
		}
		else{
			this.setState({error:data.error})
	 	}
	}

	//send to server pass request
  handlePass(){
		if(this.state.winner==""){
			this.ws.send(JSON.stringify({
				'code' : 2, username : this.state.username
			}));
		}
	}

	//send to server surrender request
	surrender(){
		if(this.state.surrendati){
			this.setState({surrendati: false});
			this.ws.send(JSON.stringify({
				'code' : 3, username : this.state.username
			}));
			this.setState({finish: true});
		}
	}

	// GRAPHIC FUNCTIONS
	getGoban(){
  	var ret = require("../img/goban9.png");
    if(this.state.dim == "13"){
    	ret = require("../img/goban13.png");
    }
    else if(this.state.dim == "19"){
    	ret = require("../img/goban19.png");
    }
    return ret;
  }

  getGobanStyle(){
  	var ret = styles.goban9;
    if(this.state.dim == "13"){
    	ret = styles.goban13;
    }
    else if(this.state.dim == "19"){
    	ret = styles.goban19;
    }
    return ret;
  }

  createBoard(){
    let board = [];
    for(let i = 0; i < parseInt(this.state.dim); i++){
    	board.push(<View style={styles.board_row}>{this.createRow(i)}</View>);
    }
    return board;
  }

  createRow(i){
  	let row = []
    for(let j = 0; j < parseInt(this.state.dim); j++){
    	row.push(this.createCell(i,j));
    }
    return row;
  }

	createCell(i,j){
  	image = this.getImage(i * this.state.dim + j);
    this.getHover(i * this.state.dim + j);
    return(
    	<this.Cell
      	id = {i * this.state.dim + j}
        value={(this.state.moves[i * this.state.dim + j]).toString()}
        name={this.state.dim}
        onPress={() => this.sendMove(i,j)}
        onPressIn={() => this.setHover(i * this.state.dim + j,i * this.state.dim + j)}
        onPressOut={() => this.setHover(-1,i * this.state.dim + j)}
        style={styleCell}
        sources={image}
      />
    );
  }

	Cell(props){
  	return (
    	<TouchableOpacity key={props.id} label={props.value} onPress={props.onPress} onPressIn={props.onPressIn}  onPressOut={props.onPressOut} style={props.style}>
      	<Image
      		source={props.sources}
        	resizeMode="contain"
        	style={styles.imageBackground}
        >
        </Image>  
    	</TouchableOpacity>
    );
  }

  getImage(index){
  	var hover = this.state.isHover;
    var ret = null;
    if(hover == index){
    	if(this.state.id_move % 2 == 0 && this.state.moves[index] == 0 && this.state.username == this.state.username1){
    		ret = require("../img/black.png");
      	return ret;
      }
      else if(this.state.id_move % 2 == 1 && this.state.moves[index] == 0 && this.state.username == this.state.username2){
      	ret = require("../img/white.png");
        return ret;
      }
    }
    else{
    	if(this.state.moves[index] == 1){
      	ret = require("../img/black.png");
        return ret;
      }
    	else if(this.state.moves[index] == 2){
    		ret = require("../img/white.png");
      	return ret;
    	}
    	else{
    		return ret;
    	}
    }
  }

	getHover(index){
		var hover = this.state.isHover;
    if(hover == index){
    	if(this.state.moves[index] != 0){
      	styleCell = styles.button9;
        if(this.state.dim == "13"){
        	styleCell = styles.button13;
        }
        else if(this.state.dim == "19"){
        	styleCell = styles.button19;
        }
      }
      else if(this.state.id_move % 2 == 0 && this.state.moves[index] == 0 && this.state.username == this.state.username1){;
      	styleCell = styles.button9Hover;
        if(this.state.dim == "13"){
        	styleCell = styles.button13Hover;
        }
        else if(this.state.dim == "19"){
        	styleCell = styles.button19Hover;
        }
      }
      else if(this.state.id_move % 2 == 1 && this.state.moves[index] == 0 && this.state.username == this.state.username2){
      	styleCell = styles.button9Hover;
        if(this.state.dim == "13"){
        	styleCell = styles.button13Hover;
        }
        else if(this.state.dim == "19"){
        	styleCell = styles.button19Hover;
        }
      }
    }
    else{
    	styleCell = styles.button9;
      if(this.state.dim == "13"){
      	styleCell = styles.button13;
      }
      else if(this.state.dim == "19"){
      	styleCell = styles.button19;
      }
    }
  }

	setHover(value,index){
		if((this.state.id_move % 2 == 0 && this.state.moves[index] == 0 && this.state.username == this.state.username1) 
		|| (this.state.id_move % 2 == 1 && this.state.moves[index] == 0 && this.state.username == this.state.username2)){
    	this.setState({isHover : value});
		}
  }


	convertTime(timer){
    var minutes; 
    var seconds; 
    if(timer >= 0){
       minutes = parseInt(Math.floor(parseInt(timer))/60);
       seconds = parseInt(Math.floor(parseInt(timer))%60);
    }
    else{
       minutes = 0;
       seconds = 0;
    }
    var stringTime = minutes +"m " + seconds + "s";
    return stringTime;
  }

	createPassButton(playerSide){
  	if(this.state.username == playerSide && this.state.finish == false && this.state.next_player == this.state.username){
  		return (
      	<this.PassButton value={"Pass"} onPress={() => this.handlePass()}/>
      );
    }
  }

  PassButton(props){
  	return (
    	<TouchableOpacity style={styles.buttonPass1} onPress={props.onPress}>
      	<Text style={[styles.helloText, styles.medium, styles.center]}>{props.value}</Text>
      </TouchableOpacity>
    );
	}

  setSurrenderDialogTrue = () => {
		this.setState({surrenderDialog: true});
  };

  setSurrenderDialogFalse = () => {
  	this.setState({surrenderDialog: false});
  };

  setFinishDialogTrue = () => {
  	this.setState({finishDialog: true});
  };

  setFinishDialogFalse = () => {
  	this.setState({finishDialog: false});
  };

  setRitorna = () => {
  	this.setState({ritorna: true, finishDialog: false});
  }
  setSurrendati = () => {
  	this.setState({surrendati: true, surrenderDialog: false});
  };

  showSurrOrHome(){
  	if(this.state.finish == false){
    	return this.showSurrender();
    }
    else{
    	return this.showFinishGame();
    }
  }

  showSurrender(){
  	return(
    	<View>
      	<TouchableOpacity style={styles.buttonPass1} onPress={this.setSurrenderDialogTrue}>
          <Text style={[styles.helloText, styles.medium, styles.center]}>Surrender</Text>
        </TouchableOpacity>
        <Dialog.Container visible={this.state.surrenderDialog}>
        <Dialog.Title>Surrender</Dialog.Title>
        <Dialog.Description>
        	Do you really want to surrender?
        </Dialog.Description>
        <Dialog.Button label="No" onPress={this.setSurrenderDialogFalse} />
        <Dialog.Button label="Yes" onPress={this.setSurrendati} />
        </Dialog.Container>
      </View>
    );
  }

  showFinishGame(){
		if(this.state.finish){    
    	return(
      <View>
      	<TouchableOpacity style={styles.buttonPass2} onPress={this.setFinishDialogTrue}>
        	<Text style={[styles.helloText, styles.medium, styles.center]}>Back to main page</Text>
     		</TouchableOpacity>
      	<Dialog.Container visible={this.state.finishDialog}>
        <Dialog.Title>Back to main page</Dialog.Title>
        <Dialog.Description>
        	Return to main page?
        </Dialog.Description>
        <Dialog.Button label="No" onPress={this.setFinishDialogFalse} />
        <Dialog.Button label="Yes" onPress={this.setRitorna} />
        </Dialog.Container>
      	</View>
     	);
  	}
  }

	showError(){
  	if(this.state.error!=''){
    	alert(this.state.error)
      this.state.error = '';
   	}
	}

  render() {
    const gameStatus = this.getNextPlayer();
    var goban = this.getGoban();
    var gobanStyle = this.getGobanStyle();

    return (
    	<ReactNativeZoomableView
				maxZoom={1.5}
		 		minZoom={1}
		 		zoomStep={0.5}
		 		initialZoom={1}
				bindToBorders={true}
				style={styles.root}
			>
      	<ScrollView style={styles.scroll}>
       		<View style={styles.window}>
          	<View style={styles.gameStatus}>
            	<Text style={[styles.helloText, styles.medium, styles.center]}>{gameStatus}</Text>
          	</View>				     
          	<View style={styles.imageContainer}>
            	<ImageBackground
              	source={goban}
                resizeMode="contain"
                style={styles.imageBackground}
             	>
              	<View style={gobanStyle}>
              		{this.createBoard()}
              	</View>
            	</ImageBackground>              
             	{this.showError()}
						</View>           
       		</View>
       		<View style={styles.window}>
          	<View style={styles.buttons}>
            	<View style={styles.buttonArea}>
              	<View style={styles.gray}>
                	<Image
                  	source={require("../img/black.png")}
                    resizeMode="contain"
                    style={styles.imagePlayer}
                 	/>
               	</View>
             	</View>
             	<View style={styles.buttonArea}></View>
             	<View style={styles.buttonArea}>
              	<View style={styles.gray}>
                	<Image
                  	source={require("../img/white.png")}
                    resizeMode="contain"
                    style={styles.imagePlayer}
                 	/>
                </View>
             	</View>
          	</View>
          	<View style={styles.table}>
          		<Table borderStyle={styles.tableBorder}>
            		<Row data={this.state.tableHead} style={styles.head} textStyle={[styles.helloText, styles.medium, styles.center]}/>
            		<TableWrapper style={styles.tableWrapper}>
              		<Col style={styles.column} data={this.state.tablePlayer1} textStyle={[styles.helloText, styles.medium, styles.center]}/> 
              		<Col style={styles.column2} data={this.state.tableStats} textStyle={[styles.helloText, styles.medium, styles.center]}/> 
              		<Col style={styles.column} data={this.state.tablePlayer2} textStyle={[styles.helloText, styles.medium, styles.center]}/> 
            		</TableWrapper>         
            	</Table>
          	</View>
          	<View style={styles.timers}>
            	<View style={styles.timerWidth}>
                <Text style={[styles.helloText, styles.medium, styles.center]}> {this.convertTime(this.state.timer1)} </Text>
             	</View>
             	<View style={styles.timerWidth}>
              	<Text style={[styles.helloText, styles.medium, styles.center]}> Time left </Text>
             	</View>
             	<View style={styles.timerWidth}>
              	<Text style={[styles.helloText, styles.medium, styles.center]}> {this.convertTime(this.state.timer2)} </Text>
             	</View>
          	</View>
          	<View style={styles.buttons}>
          		<View style={styles.buttonArea}>
            		{this.createPassButton(this.state.username1)}
            	</View>
            	<View style={styles.buttonArea}>
            		{this.showSurrOrHome()}
            	</View>
            	<View style={styles.buttonArea}>
            		{this.createPassButton(this.state.username2)}
            	</View>
          	</View>
       		</View>
     		</ScrollView>
    	</ReactNativeZoomableView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
  	width: "100%",
    height: "100%",
    backgroundColor: "#595959",
  },
  scroll: {
    backgroundColor: '#595959',
  },
  window: {
    backgroundColor: '#252525',
    width: "95%",
    margin: vh,
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: 4,
  },
  helloText: {
    color: "#CCCCCC",
    textAlignVertical: `center`,
    fontFamily: `Courier`,
    fontWeight: `700`,
    fontStyle: `normal`
  },
  imagePlayer:{
   	width: 35,
   	height: 35,
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
  rowFlex:{
    flex: 1,
    flexDirection: "row",
  },
  gameStatus: {
  	backgroundColor: "#800000",
    width: "80%",
    marginLeft: "auto",
    marginRight: "auto",
    height: 4*vh,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    margin: vh,
  },
  gameStatusText:{
    textAlign: "center",
  },
  imageContainer: {
    margin: vh,
    backgroundColor: "#966f33",
    width: 45*vh,
    height: 45*vh,
    marginLeft: "auto",
    marginRight: "auto"
  },
  imageBackground: {
    width: "100%",
    height: "100%",   
    opacity: 1,
	},
	error: {
    color: 'red',
    marginLeft: "auto",
    marginRight: "auto",
    backgroundColor: '#000000',
  },
  goban9: {
    top: 4.1*vh,
    left: 7.9*vw, 
    width: "100%",
    height: "100%",
    opacity: 1,
  },
  goban13: {
    top: 2.7*vh,
    left: 6*vw, 
    width: "100%",
    height: "100%",
    opacity: 1,
  },
  goban19: {
    top: 2*vh,
    left: 4.1*vw, 
    width: "100%",
    height: "100%",
    opacity: 1,
  },
  button9: {
    height: 4.09*vh,
    width: "9.03%",
    opacity: 1,
  },
  button9Hover: {
    height: 4.09*vh,
    width: "9.03%",
    opacity: 1,
  },
  button13: {
    height: 3.01*vh,
    width: "6.65%",
    opacity: 1,
  },
  button13Hover: {
    height: 3.01*vh,
    width: "6.65%",
    opacity: 1,
  },
  button19: {
    height: 2.15*vh,
    width: "4.76%",
    opacity: 1,
  },
  button19Hover: {
    height: 2.15*vh,
    width: "4.76%",
    opacity: 1,
  },
  board_row:{
    flexDirection: "row",
  },
  table:{
    width: "90%",
    margin: vh,
    marginLeft: "auto",
    marginRight: "auto"
  },
  tableBorder:{
    borderWidth: 2,
    borderColor: "#CCCCCC",
  },
  tableWrapper:{
    flexDirection: "row",
  },
  head:{
    height: 6*vh,
    textAlign: "center",
    backGroundColor: "#800000",
  },
  column:{
    flex: 1,
    height: 15*vh,
  },
  column2:{
    backgroundColor: "#800000",
    flex: 1,
    height: 15*vh,
  },
  text:{
    margin: 1.1*vh,
    textAlign: "center",
  },
  text2:{
    backGroundColor: "#800000",
    margin: 1.1*vh,
    textAlign: "center",
  },
  timers:{
    width: "90%",
    borderWidth: 2,
    borderColor: "#CCCCCC",
    flexDirection: "row",
    margin: vh,
    marginLeft: "auto",
    marginRight: "auto"
  },
  buttons:{
    width: "90%",
    borderWidth: 0,
    flexDirection: "row",
    margin: 2*vh,
    marginLeft: "auto",
    marginRight: "auto"
  },
  timerWidth: {
    width: "33%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonArea:{
  	width: "33%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  gray : {
  	width: "50%",
    backgroundColor: "#595959",
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },    
  buttonPass1: {
    backgroundColor: "#800000",
    borderRadius: 2,
    height: 4*vh,
    width: 20*vw,
    justifyContent: 'center',
    alignItems: 'center',
  },
	buttonPass2: {
    backgroundColor: "#800000",
    borderRadius: 2,
    height: 4*vh,
    width: 40*vw,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

