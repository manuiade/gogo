
import React, { Component } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Image } from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

var {vw,vh,vmin,vmax} = require('react-native-viewport-units');

export default class Home extends Component {
  constructor(props){
    super(props);
  }

  componentDidMount(){
    this.getCredentials();
  }

  //if credentials are already memorized redirect user to welcome page
  async getCredentials() {
    const { navigate } = this.props.navigation;
    const credentials = await AsyncStorage.getItem(CREDENTIALS);
    if (credentials) {
      this.props.navigation.replace('Welcome', {username : credentials});
    }
  }

  render() {
    const { navigate } = this.props.navigation;
    return (
      <View style={styles.root}>
        <View style={styles.imageContainer}>
          <Image
            source={require("../img/background.png")}
            resizeMode="contain"
            style={styles.image}
          />
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={() => navigate('Login')}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigate('Signup')}>
            <Text style={styles.buttonText}>Signup</Text>
          </TouchableOpacity>
        </View>
     </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#595959',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: "100%",
    height: "100%",
  },
  imageContainer:{
    width:"90%",
    height:"70%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  buttonsContainer: {
    width:"100%",
    height:"30%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    margin: 20,
    backgroundColor: "#800000",
    borderRadius: 4,
    height: 6*vh,
    width: 40*vw,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: `Courier`,
    fontWeight: `900`,
    fontStyle: `normal`,
    color: '#FFFFFF',
  },
});

export const CREDENTIALS = 'credentials';

