import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Dashboard from '../Dashboard';
import Scanner from '../Scanner';
import Profile from '../Profile';
// import TicketDetails from '../TicketDetails';

const Tab = createBottomTabNavigator();

export default function BottomNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{ 
        headerShown: false, 
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 65,
          marginTop: 0,
          marginBottom: 0,
          paddingBottom: 15,
        }
      }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen name="Dashboard" options={{
        tabBarLabel: 'Home',
        tabBarActiveTintColor: '#113F67',
        headerShown: false,
        unmountOnBlur: true,
        tabBarIcon: ({ focused }) => (
          <Image source={focused ? require('../../assets/home-icon-silhouette.png') : require('../../assets/home.png') } style={{ width: 30, height: 30 }} />
        ),
      }} component={Dashboard} />
      <Tab.Screen name="Scanner" options={{
        tabBarLabel: 'Scanner',
        tabBarActiveTintColor: '#113F67',
        headerShown: false,
        unmountOnBlur: true,
        tabBarIcon: ({ focused }) => (
          <Image source={focused ? require('../../assets/scan_1.png') : require('../../assets/scan.png')} style={{ width: 30, height: 30 }} />
        ),
      }} component={Scanner} />
      <Tab.Screen name="Profile" options={{
        tabBarLabel: 'Profile',
        tabBarActiveTintColor: '#113F67',
        headerShown: false,
        unmountOnBlur: true,
        tabBarIcon: ({ focused }) => (
          <Image source={focused ? require('../../assets/user_1.png') : require('../../assets/user.png')} style={{ width: 30, height: 30 }} />
        ),
      }} component={Profile} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({

});