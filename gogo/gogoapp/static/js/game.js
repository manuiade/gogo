/***************************************************************************************************
                                           REACT GAME PAGE
 **************************************************************************************************/

/********************Flag used for manage surrender dialogs and main page dialogs ********************/
var confirmSurr = false;
var confirmFinish = false;
var arrenditi = false;
var ritorna = false;
var finish = false;
const IP = "192.168.178.105:8000";


const setConfirmSurrZero = () => {
   confirmSurr = false;
};

const setConfirmFinishZero = () => {
   confirmFinish = false;
};

const setConfirmSurrOne = () => {
   confirmSurr = true;
};

const setConfirmFinishOne = () => {
   confirmFinish = true;
};

const setArrenditi = () => {
   arrenditi = true;
   confirmSurr = false;
};

const setRitorna = () => {
    ritorna = true;
    confirmFinish = false;
};
/**************************************************************************************************/

/************************* Calculate button and goban size for rendering **************************/
function getClassName(c1,c2,c3,dim){
   var className = "";     
   if(dim == "9") {
      className = c1;
   }   
   else if (dim == "13") {
      className = c2;
   } 
   else{
      className = c3;
   }
   return className;
}

function getButtonClassName(dim,value){   
   var buttonClassName = getClassName("button9x9","button13x13","button19x19", dim);
   if(value == "1"){
      if(buttonClassName == "button9x9"){
         buttonClassName = "button9x9black";
      }
      else if(buttonClassName == "button13x13"){
         buttonClassName = "button13x13black";
      }
      else if(buttonClassName == "button19x19"){
         buttonClassName = "button19x19black";
      }
   }
   else if(value == "2"){
      if(buttonClassName == "button9x9"){
         buttonClassName = "button9x9white";
      }
      else if(buttonClassName == "button13x13"){
         buttonClassName = "button13x13white";
      }
      else if(buttonClassName == "button19x19"){
         buttonClassName = "button19x19white";
      }
   }
   return buttonClassName;
}
/**************************************************************************************************/

/*********************************** Class Game Render ********************************************/
class Game extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         hash_code : data.hash_code,
         username : data.username,
         next_player : '',
         username1 : '',
         username2 : '',
         elo1 : '',
         elo2 : '',
         moves : '',
         score1 : '',
         score2 : '',
         pedine1 : '',
         pedine2 : '',
         id_move : '',
         dim : '',
         current_timer1 : '',
         current_timer2 : '',
         error : "",
         winner : "",
         confirmSurr: 0,
         confirmFinish: 0,
      };
   }
 
   setParams(data){
      this.setState({username1: data.username1, username2: data.username2, elo1: data.elo1, elo2: data.elo2,
         current_timer1: data.current_timer1, current_timer2: data.current_timer2,
         dim: data.dim, next_player : data.next_player, moves: data.moves, score1 : data.score1, score2 : data.score2,
         pedine1 : data.pedine1, pedine2: data.pedine2, id_move : data.id_move })
   }

   /****************************** Get game status and connect websocket ***********************************************/
   componentDidMount() {
      fetch(window.location.href + "/get_params?username=" + this.state.username)
         .then(response => response.json())
         .then(data => this.setParams(data))
         .catch((error)=>{
            alert("No connection to the server");
         });
         
      this.connection = new WebSocket('ws://'+ IP + '/ws/gogoapp/game/' + this.state.username + '/' + this.state.hash_code + '/');

      this.connection.onmessage = evt => { 
         const d = JSON.parse(evt.data)
         const data = d.data;
         if(data.moves){
            this.setState({ next_player : data.username, moves: data.moves, score1 : data.score1, score2 : data.score2, pedine1 : data.pedine1,
               pedine2: data.pedine2, id_move : data.id_move})
            if(this.state.current_timer1 > 1){
               this.setState({current_timer1 : data.timer1})
            }
            else{
               this.setState({current_timer1 : 0})
             }
            if(this.state.current_timer2 > 1){
               this.setState({current_timer2 : data.timer2})
            }
            else{
               this.setState({current_timer2 : 0})
             }
         }
         else if(data.error){
            alert(data.error);
         }
         else if(data.winner){
            this.setState({winner : data.winner})
            finish = true;
            if(data.victory == 2){
               if(data.player == this.state.username1){
                 this.setState({current_timer2 : 0})
               }
               else if(data.player == this.state.username2){
                 this.setState({current_timer1 : 0})
               }
            }
         }
      };
      this.interval = setInterval(() => this.update(), 1000);
   }
   /********************************************************************************************************************/

   /******************* Updates times on screen and call server when a timer reaches 0 *********************************/
   update(){
      if(this.state.winner == ""){
         var timer1 = 0;
         var timer2 = 0;
         if(this.state.id_move % 2 == 0){
            if(this.state.current_timer1 > 0){
               timer1 = this.state.current_timer1 - 1;
            }
            if(timer1 <= 0){
               timer1 = 0;
               this.connection.send(JSON.stringify({
                  'code' : 1
               }));
            }
            this.setState({current_timer1:timer1});
         }
         else{
            if(this.state.current_timer2 > 0){
               timer2 = this.state.current_timer2 - 1;
            }
            if(timer2 <= 0){
               timer2 = 0;
               this.connection.send(JSON.stringify({
                  'code' : 1
               }));
            }
            this.setState({current_timer2:timer2});
         }
         this.surrender();
      }
      else{
         this.setState({next_player: ''});
         this.returnWelcome();
      }
   }
   /********************************************************************************************************************/

   //call server when cell is clicked
   handleClick(i,j){
      const moves = this.state.moves.slice();
      if(this.state.winner==""){
         this.connection.send(JSON.stringify({
            'code' : 0, id : parseInt(parseInt(i)*parseInt(this.state.dim)+parseInt(j)) , username : this.state.username
         }));
      }
   }

   //updates goban status
   setTurn(data){
      if(data.moves){
         this.setState({moves: data.moves, error : "" });
      }
      else{
         this.setState({error:data.error})
         alert(this.state.error);
      }
   }

   //tell server that user has passed turn
   handlePass(){
      if(this.state.winner==""){
         this.connection.send(JSON.stringify({
            'code' : 2, 
            'username' : this.state.username
         }));
      }
   }

   //tell server that user has surrendered
   surrender(){
      if(arrenditi){
         arrenditi = false;
         this.connection.send(JSON.stringify({
            'code' : 3, 
            'username' : this.state.username
         }));
         finish = true;
      }
   }

   //render a semi-opaque stone when user hover a free cell
   handleHover(dim,id_move,user,username1, username2,i,j,moves){
      if(this.state.winner == ""){
         var id = (i*dim+j);
         var cell = document.getElementById(id);
         if(id_move % 2 == 0 && user == username1 && moves[i*dim+j] == 0){
            if(dim == "9") {
               cell.className = "button9x9BlackHover";
            }   
            else if (dim == "13") {
               cell.className = "button13x13BlackHover";
            } 
            else{
               cell.className = "button19x19BlackHover";
            }
         }   
         if(id_move % 2 == 1 && user == username2 && moves[i*dim+j] == 0){
            if(dim == "9") {
               cell.className = "button9x9WhiteHover";
            }  
            else if (dim == "13") {
               cell.className = "button13x13WhiteHover";
            }
            else{
               cell.className = "button19x19WhiteHover";
            }
         }
      }
   }

   //cancel previous hover render
   handleLeave(dim,id_move,user,username1, username2,i,j,moves){
      var id = (i*dim+j);    
      var cell = document.getElementById(id);
      if(moves[i*dim+j] == 0){
         if(dim == "9") {
            cell.className = "button9x9";
         }
         else if (dim == "13") {
            cell.className = "button13x13";
         }  
         else{
            cell.className = "button19x19";
         }
      }    
   }

   /*********************************************************** Cell Render on Goban ************************************************************/
   Cell(props){
      const buttonClassName = getButtonClassName(props.name,props.value);
      return (
         <button id={props.id} className={buttonClassName} onMouseEnter={props.onMouseEnter} onMouseLeave={props.onMouseLeave} onClick={props.onClick}>{}</button>
      );
   }

   createCell(i,j){
      return(
         <this.Cell
            id = {i * this.state.dim + j}
            value={this.state.moves[i * this.state.dim + j]}
            name={this.state.dim}
            onMouseEnter={() => this.handleHover(this.state.dim, this.state.id_move, this.state.username, this.state.username1, this.state.username2,i,j, this.state.moves)}
            onMouseLeave={() => this.handleLeave(this.state.dim, this.state.id_move, this.state.username, this.state.username1, this.state.username2,i,j, this.state.moves)}
            onClick={() => this.handleClick(i,j)}
         />
      );
   }

   createRow(i){
      let row = []
      for(let j = 0; j < parseInt(this.state.dim); j++){
        row.push(this.createCell(i,j));
      }
      return row;
   }

   createBoard(){
      let board = [];
      for(let i = 0; i < parseInt(this.state.dim); i++){
         board.push(<div className="board-row">{this.createRow(i)}</div>);
      }
      return board;
   }
   /********************************************************************************************************************************************/

   /******************************************************** Render Pass Button based on turn **************************************************/
   PassButton(props){
      return (
         <button className={props.id} onClick={props.onClick}>{props.value}</button>
      );
   }

   createPassButtonBlack(){
      if(this.state.id_move % 2 == 0 && this.state.username == this.state.username1){
         return (
            <this.PassButton id = "passBlack" value={"Pass"} onClick={() => this.handlePass()}/>
         );
      }
      return (
         <div></div>
      );
   }

   createPassButtonWhite(){
      if(this.state.id_move % 2 == 1 && this.state.username == this.state.username2){
         return (
            <this.PassButton id = "passWhite" value={"Pass"} onClick={() => this.handlePass()}/>
         );
      }
      return (
         <div></div>
      );
   }
   /********************************************************************************************************************************************/
   
   /********************************************************** Main page dialog handler ********************************************************/
   returnWelcome(){
      if(ritorna){
         fetch(window.location.href = "../welcome");
      }
   }

   showFinishDialog(){
      if(confirmFinish){
         return(
            <div>
               <window.MaterialUI.Dialog
                  open={confirmFinish}
                  onClose={setConfirmFinishZero}
                  aria-describedby="alert-dialog-description">
                  <div className="contenuto">
                     <window.MaterialUI.DialogContent className="content">
                        <window.MaterialUI.DialogContentText className="text" id="alert-dialog-description">
                           Return to main page?
                        </window.MaterialUI.DialogContentText>
                     </window.MaterialUI.DialogContent>
                     <window.MaterialUI.DialogActions className="action">
                        <window.MaterialUI.Button className="cancel" onClick={setConfirmFinishZero} color="primary">
                           No
                        </window.MaterialUI.Button>
                        <window.MaterialUI.Button className="confirm" onClick={setRitorna} color="primary" autoFocus>
                           Yes
                        </window.MaterialUI.Button>
                     </window.MaterialUI.DialogActions>
                  </div>
               </window.MaterialUI.Dialog>
            </div>
         );
      }
   }

   finishGame(){
      if(finish){    
         return(
            <div>
               <window.MaterialUI.Button className="finish-button" onClick={setConfirmFinishOne}>
                  Back to main page
               </window.MaterialUI.Button>
               <div>{this.showFinishDialog()}</div>
            </div>
         );
      }
      else{
         return(
            <div></div>
         );
      }
   }
   /*****************************************************************************************************************************************/
   
   /********************************************************* Surrender dialog handler ******************************************************/
   showSurrDialog(){
      if(confirmSurr){
         return(
            <div>
               <window.MaterialUI.Dialog
                  open={confirmSurr}
                  onClose={setConfirmSurrZero}
                  aria-describedby="alert-dialog-description">
                  <div className="contenuto">
                     <window.MaterialUI.DialogContent className="content">
                        <window.MaterialUI.DialogContentText className="text" id="alert-dialog-description">
                           Do you really want to surrender?
                        </window.MaterialUI.DialogContentText>
                     </window.MaterialUI.DialogContent>
                     <window.MaterialUI.DialogActions className="action">
                        <window.MaterialUI.Button className="cancel" onClick={setConfirmSurrZero} color="primary">
                           No
                        </window.MaterialUI.Button>
                        <window.MaterialUI.Button className="confirm" onClick={setArrenditi} color="primary" autofocus>
                           Yes
                        </window.MaterialUI.Button>
                     </window.MaterialUI.DialogActions>
                  </div>
               </window.MaterialUI.Dialog>
            </div>
         );
      }
   }

   createSurrenderButton(){
      if(!finish){
         return(
            <div>
               <window.MaterialUI.Button className="surr-button" onClick={setConfirmSurrOne}>
                  Surrender
               </window.MaterialUI.Button>
               <div>{this.showSurrDialog()}</div>
            </div>
         );
      }
      else{
         return(
            <div></div>
         );
      }
   }
   /***************************************************************************************************************************************/

   //Convert time in minutes and seconds format
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

   //Render function, called each time a component changes
   render() {
      let status = '';
      if(this.state.winner == ''){
         status = "Next player: " + this.state.next_player;
      }
      else{
         status = this.state.winner;   
      } 
      const username1 = this.state.username1;
      const username2 = this.state.username2;
      const elo1 = "Elo: " + this.state.elo1;
      const elo2 = "Elo: " + this.state.elo2;
      const time1 = "Time left: " + this.convertTime(this.state.current_timer1);
      const time2 = "Time left: " + this.convertTime(this.state.current_timer2);
      const score1 = "Score: " + this.state.score1;
      const score2 = "Score: " + this.state.score2;
      const pedine1 = "Stones: " + this.state.pedine1;
      const pedine2 = "Stones: " + this.state.pedine2;
      const gobanClassName = getClassName("goban9x9","goban13x13","goban19x19",this.state.dim);
      const boardClassName = getClassName("board9x9","board13x13","board19x19",this.state.dim);

      return (
         <div className="root">
            <div className="next">
               <div className="surrender">{this.createSurrenderButton()}</div>
               <h1 className="status">{status}</h1>
               <div className="finish">{this.finishGame()}</div>
            </div>  
            <div className="game">
               <div className="player1">
                  <div className="username">{username1}</div>
                  <div className="elo">{elo1}</div>
                  <div className="time">{time1}</div>
                  <div className="score">{score1}</div>
                  <div className="pedine">{pedine1}</div>
                  <div className="black">{this.createPassButtonBlack()}</div>
               </div>
               <div className={gobanClassName}>
                  <div className={boardClassName}>
                     {this.createBoard()}
                  </div>
               </div>
               <div className="player2">
                  <div className="username">{username2}</div>
                  <div className="elo">{elo2}</div>
                  <div className="time">{time2}</div>
                  <div className="score">{score2}</div>
                  <div className="pedine">{pedine2}</div>
                  <div className="white">{this.createPassButtonWhite()}</div>
               </div>
            </div>
         </div>
      );
   }
}

ReactDOM.render(<Game />, document.getElementById('game'));
