import React from 'react';
import Scanner from './src/Scanner';
import TicketDetails from './src/TicketDetails';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import Navigation from './src/components/Navigation';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <AuthProvider>
        <StatusBar hidden={true} />
        <Navigation />
      </AuthProvider>
    </>
    // <NavigationContainer>
    //   <Stack.Navigator>
    //     <Stack.Screen name="Scanner" component={Scanner} options={{headerShown: false}}/>
    //     <Stack.Screen name="TicketDetails" component={TicketDetails} options={{headerShown: false}}/>
    //   </Stack.Navigator>
    // </NavigationContainer>
  )
}