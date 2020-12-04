import React, { Component} from 'react';
import {Text,StyleSheet} from 'react-native';
import {createStackNavigator} from 'react-navigation-stack';
import {createAppContainer} from 'react-navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';
import Game from './pages/Game';

const App = createStackNavigator({
    Home: {
      screen: Home,
      navigationOptions: ({navigation}) => ({
        headerStyle: styles.headerStyle,
        headerTitle: <Text style={styles.headerText}>Home</Text>
      })
    }, 
    Login: {
      screen: Login,
      navigationOptions: ({navigation}) => ({
        headerStyle: styles.headerStyle,
        headerTitle: <Text style={styles.headerText}>Login</Text>,
        headerTintColor: '#CCCCCC',
      })
    },
    Signup: {
      screen: Signup,
      navigationOptions: ({navigation}) => ({
        headerStyle: styles.headerStyle,
        headerTitle: <Text style={styles.headerText}>Signup</Text>,
        headerTintColor: '#CCCCCC',
      })
    }, 
    Welcome: { 
      screen: Welcome,
      navigationOptions: ({navigation}) => ({
        headerStyle: styles.headerStyle,
        headerTitle: <Text style={styles.headerText}>Welcome</Text>,
        headerTintColor: '#CCCCCC',
      })
    },
    Game: { 
      screen: Game,
      navigationOptions: ({navigation}) => ({
        headerStyle: styles.headerStyle,
        headerTitle: <Text style={styles.headerText}>Game</Text>,
        headerTintColor: '#CCCCCC',
      })
    },
  },
  {
    initialRouteName: 'Home',
  }
);

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: "#222222",
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  },
  headerText: {
    color: "#CCCCCC",
    fontSize: 22,
    textAlignVertical: `center`,
    textAlign: `center`,
    fontFamily: `Courier`,
    fontWeight: `700`,
    fontStyle: `normal`
  },
});

export default createAppContainer(App);
