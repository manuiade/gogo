import React, { Component } from 'react';
import { Picker, KeyboardAvoidingView, StyleSheet, View, TouchableOpacity, ScrollView, Text, TextInput, Button } from 'react-native';

import RNCountry from 'react-native-countries';
import PasswordStrengthChecker from './components/PasswordStrengthChecker';
var {vw,vh,vmin,vmax} = require('react-native-viewport-units');
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

const IP = "192.168.178.122:8000";

export default class Signup extends Component {
  constructor(props){
    super(props);
    this.state ={ 
       username: {
        value: '',
        isValid: false,
        error: '',
       },
       email: {
        value: '',
        isValid: true,
        error: '',
       },
       nationality: {
        value: '',
        isValid: false
       },
       password: {
        value: '',
        isValid: false,
        error: '',
       },
       password2: {
        value: '',
        isValid: false,
        error: '',
       }
    };
  }

  //initialize country picker values (needed for registration)
  componentWillMount() {
    let countryNamesWithCodes = RNCountry.getCountryNamesWithCodes;
    countryNamesWithCodes.sort((a, b) => a.name.localeCompare(b.name));
    this.setState({
      countryNameListWithCode: countryNamesWithCodes
    })
  }

  //call a AJAX request to check if inserted username is already taken or invalid
  usernameValidate(){
    if(this.state.username.value !="" && this.state.username.value != undefined){
    fetch("http://" + IP + "/gogoapp/signup/validate_username?username=" + this.state.username.value)
    .then((response) => response.json())
    .then(data => {
      this.username_exists(data)
    })
    .catch((error) =>{
      alert("No connection to the server");
    });
    }
  }

  //set username status based on validate request
  username_exists(data){
    value = this.state.username.value;
    if(data.is_taken){
      this.setState({ username: {  isValid: false, error: 'Username already exists'}})
    }
    else if(!data.is_valid || value == ''){
      this.setState({ username: {  isValid: false, error: 'Only alphanumeric characters allowed' }})
    }
    else{
      this.setState({username : { value : value, isValid : true, error: '' }})
    }
  }

 //call a AJAX request to check if inserted email is already taken or invalid
  emailValidate(){
    if(this.state.email.value !="" && this.state.email.value != undefined){
      fetch("http://" + IP + "/gogoapp/signup/validate_email?email=" + this.state.email.value)
      .then((response) => response.json())
      .then(data => {
        this.email_exists(data)
      })
      .catch((error) =>{
        alert("No connection to the server");
      });
    }
  }

  //set email status based on validate request
  email_exists(data){
    value = this.state.email.value;
    if(data.is_taken){
      this.setState({ email: {  isValid: false, error: 'Email already exists'}})
    }
    else if(!data.is_valid){;
      this.setState({ email: {  isValid: false, error: 'Email not valid' }})
    }
    else{
      this.setState({email : { value : value, isValid : true, error: '' }})
    }
  }

  //check if password fields match
  passwordConfirm(){
    if(this.state.password2.value != this.state.password.value){
      this.setState({ password2: {  isValid: false, error: "Passwords don't match" }})
    }
    else{
      this.setState({ password2: {  isValid: true, error: '' }})
    }
  }

  //send a signup request if all fields are validated
  signup(){
    if(!this.state.username.isValid){
      if(this.state.username.error == ""){
        alert("Username required");
      }
      else{
        alert(this.state.username.error);
      }
      return;
    }
    if(!this.state.email.isValid){
      alert("Email required");
      return;
    }
    if(!this.state.nationality.isValid){
      alert("Nationality required");
      return;
    }
    if(!this.state.password.isValid){
      alert("Insert a password with upper/lower case character and digits");
      return;
    }
    if(!this.state.password2.isValid){
      if(this.state.password2.error == ""){
        alert("Confirm password required");
      }
      else{
        alert(this.state.password2.error);
      }
      return;
    }
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username : this.state.username.value , email: this.state.email.value,
        nationality: this.state.nationality.value, password : this.state.password.value })
    };
    fetch('http://' + IP + '/gogoapp/signup_mobile', requestOptions)
    .then(response => response.json())
    .then(data => this.isRegistered(data))
    .catch((error) =>{
      alert("No connection to the server");
    });
  }

  //if server confirms registration redirect to login page
  isRegistered(data){
    const { navigate } = this.props.navigation;
    if(data.registered){
      navigate('Login');
    }
  }

  //display error messages
  showError(error){
    if(error != '' && error != undefined){
      return(
        <View tyle={styles.textLabel}>
          <Text style={styles.errorText}> {error} </Text>
        </View>
      );
    }
  }

 
  render() {
    //strength levels for password strength checker
    const strengthLevels = [
      {
        label: ' Very Weak',
        labelColor: '#ff6600',
        widthPercent: '20',
        innerBarColor: '#ff6600'
      },
      {
        label: 'Weak',
        labelColor: '#cca300',
        widthPercent: '40',
        innerBarColor: '#cca300'
      },
      {
        label: 'Fair',
        labelColor: '#ffff33',
        widthPercent: '60',
        innerBarColor: '#ffff33'
      },
      {
        label: 'Very Fair',
        labelColor: '#80ff00',
        widthPercent: '80',
        innerBarColor: '#80ff00'
      },
      {
        label: 'Strong',
        labelColor: '#008000',
        widthPercent: '100',
        innerBarColor: '#008000'
      }
    ];

    const tooShort = {
      enabled: true,
      label: 'Too short',
      labelColor: 'red'
    };

    return (
      <View style={styles.root}>
        <KeyboardAwareScrollView style={styles.scroll}>
          <View style={styles.window}>
            <View style={styles.textLabel} >
              <Text style={[styles.helloText, styles.medium]}> Username : </Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter username"
              placeholderTextColor="#CCCCCC"
              onChangeText={(text) => this.setState({ username: {value : text} })} 
              onEndEditing={(text) => this.usernameValidate()}
            />
            <View style={styles.textLabel}>
              {this.showError(this.state.username.error)}
            </View>
            <View style={styles.textLabel} >
              <Text style={[styles.helloText, styles.medium]}> Email address (optional) : </Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter email (optional)"
              placeholderTextColor="#CCCCCC"
              onChangeText={(text) => this.setState({ email: {value : text, isValid : true} })} 
              onEndEditing={(text) => this.emailValidate()}
            />
            <View>
              {this.showError(this.state.email.error)}
            </View>
            <View style={styles.textLabel} >
              <Text style={[styles.helloText, styles.medium]}> Select a country : </Text>
            </View>
            <Picker
              style={styles.pickerInput}
              selectedValue={this.state.nationality.value}
              onValueChange={(itemValue, itemIndex) => this.setState({ nationality: {value : itemValue, isValid: true} })}>
              {this.state.countryNameListWithCode.map((val) => {
                return <Picker.Item key={'country-item-' + val.code} label={val.name} value={val.name} color="#CCCCCC"/>
              })}
            </Picker>
            <View style={styles.inputWrapper}>
              <View style={styles.textLabel}>
                <Text style={[styles.helloText, styles.medium]}>Insert password : </Text>
              </View>
              <View style={styles.passwordContainer}>
                <PasswordStrengthChecker
                  secureTextEntry
                  minLength={8}
                  ruleNames='lowerCase|upperCase|digits'
                  strengthLevels={strengthLevels}
                  tooShort={tooShort}
                  minLevel={2}
                  barWidthPercent={83}
                  showBarOnEmpty={true}
                  barColor="#CCCCCC"
                  onChangeText={(text, isValid) => this.setState({ password: { value: text, isValid: isValid } })} 
                />
              </View>
            </View>
            <View style={styles.textLabel} >
              <Text style={[styles.helloText, styles.medium]}> Confirm password : </Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Confirm password"
              placeholderTextColor="#CCCCCC"
              secureTextEntry
              onChangeText={(text) => this.setState({ password2: { value: text} })} 
              onEndEditing={(text) => this.passwordConfirm()}
            />
            <View>
              {this.showError(this.state.password2.error)}
            </View>
            <TouchableOpacity style={styles.button} onPress={() => this.signup()}>
              <Text style={styles.buttonText}>Signup</Text>
            </TouchableOpacity>
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
  textLabel: {
    margin: 10,
    width: "90%",
    alignSelf: "center",
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
  textInput: {
    margin: 5,
    padding: 5,
    width: "90%",
    borderColor: "#CCCCCC",
    color: "#CCCCCC",
    alignSelf: "center",
    borderWidth: 2,
  },
  pickerInput: {
    margin: 5,
    width: "90%",
    borderColor: "#595959",
    alignSelf: "center",
  },
  wrapper: {
    margin: 5,
    width: "90%",
  },
  inputWrapper: {
    margin: 5,
    width: "90%",
  },
  passwordContainer: {
    width: "90%",
    alignSelf: "center",
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
  errorText: {
    color: "#FF0000",
    textAlignVertical: `center`,
    fontFamily: `Courier`,
    fontWeight: `700`,
    fontStyle: `normal`
  }
});

