import React from 'react';
import Scanner from './Scanner';
import TicketDetails from './TicketDetails';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Scanner" component={Scanner} options={{headerShown: false}}/>
        <Stack.Screen name="TicketDetails" component={TicketDetails} options={{headerShown: false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}