import React, { Component } from 'react';
import { StyleSheet, View, Text, TextInput, Button, TouchableOpacity } from 'react-native';

import t from 'tcomb-form-native';

import AsyncStorage from '@react-native-community/async-storage';
var {vw,vh,vmin,vmax} = require('react-native-viewport-units');
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

//customize form style
t.form.Form.stylesheet.textbox.normal.borderColor = "#CCCCCC";
t.form.Form.stylesheet.textbox.normal.borderWidth = 2; 
t.form.Form.stylesheet.textbox.normal.color = "#CCCCCC";
t.form.Form.stylesheet.controlLabel.color = "#CCCCCC";

//form declaration
const Form = t.form.Form;

const IP = "192.168.178.122:8000";

const User = t.struct({
  username: t.String,
  password: t.String,
});

const options = {
  fields: {
    username: {
      error: 'Insert a valid username',
    },
    password: {
      error: 'Insert correct password',
      password: true,
      secureTextEntry: true
    },
  },
};

export default class Login extends Component {

  constructor(props){
    super(props);
    this.state ={ 
      username : '',
      password : '',
      connectionState: false,
    };
  }
 
  //send login request to the server
  login(){
    const value = this._form.getValue();
    if(value != null){
      this.setState({
        username: value.username,
        password: value.password
      })
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username : value.username , password : value.password })
      };
      fetch('http://' + IP + '/gogoapp/login_mobile', requestOptions)
      .then(response => response.json())
      .then(data => this.isAuthenticated(data))
      .catch((error) =>{
        this.setState({connectionState: true});
      });
    }
  }

  //check if server authenticate login
  isAuthenticated(data){
    if(data.authenticated){
      this.saveCredentials(this.state.username);      
    }
    else{
      alert("Wrong username or password");
    }
  }

  //if authenticated, save credentials and redirect to welcome page
  async saveCredentials(username){
    this.setState({connectionState: false});
    const { navigate } = this.props.navigation;
    const credentials = username;
    await AsyncStorage.setItem(CREDENTIALS, credentials);
    this.props.navigation.replace('Welcome', {username : credentials});
  }

  //connection error display
  showConnectionErrors(){
    let connectionError = "";
    if(this.state.connectionState){
      connectionError = "No connection to the server";
    }
    return(
      <View>
        <Text>{connectionError}</Text>
      </View>
    );
  }

  render() {    
    return (
      <View style={styles.root}>
        <KeyboardAwareScrollView style={styles.scroll}>     
          <View style={styles.formContainer}>
            <View style={styles.contFormContainer}>
              <Form
                ref={c => this._form = c}
                type={User} 
                options={options}
              />
              <TouchableOpacity style={styles.button} onPress={() => this.login()}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              <View>
                {this.showConnectionErrors()}
              </View>
            </View>
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
  contFormContainer: {
    backgroundColor: '#252525',
    width:"90%",
    height:"90%",
  
  },
  formContainer: {
    backgroundColor: '#252525',
    width: "85%",
    flex: 1,
    margin: 20*vh,
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export const CREDENTIALS = 'credentials';
