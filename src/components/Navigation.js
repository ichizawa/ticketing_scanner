import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Scanner from '../Scanner';
import TicketDetails from '../TicketDetails';
import Login from '../Login';
import BottomNavigation from './BottomNavigation';
import Profile from '../Profile';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sales from '../Sales';

const Stack = createNativeStackNavigator();

export default function Navigation() {
    const { userDetails } = useContext(AuthContext);

    // useEffect(async () => {
    //     const userData = await AsyncStorage.getItem("userDetails");

    //     if (userData) {

    //     }

    // }, [])

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {userDetails ?
                    <>
                        <Stack.Screen name="Main" component={BottomNavigation} options={{ headerShown: false }} />
                        <Stack.Screen name="Scanner" component={Scanner} options={{ headerShown: false }} />
                        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
                        <Stack.Screen name="TicketDetails" component={TicketDetails} options={{ headerShown: false }} />
                        <Stack.Screen name="Sales" component={Sales} options={{ headerShown: false }} />
                    </> : <>
                        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                    </>}
            </Stack.Navigator>
        </NavigationContainer>
    )
}