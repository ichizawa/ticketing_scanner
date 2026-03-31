import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from 'react';
import LoginScreen from "../screens/auth/LoginScreen";
import DrawerNavigation from "./DrawerNavigation";
import ScannerScreen from '../screens/organizer/ScannerScreen';
import { AuthContext } from '../context/AuthContext';
import EventDetailsScreen from '../screens/merchant/EventDetailsScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
    const { userInfo } = useContext(AuthContext);

    // Check if user is a merchant (handle different API response structures)
    const userRole = userInfo?.role || userInfo?.user?.role || userInfo?.type;
    const isMerchant = userRole === 'staff' || userRole === 'admin';

    console.log('User Info:', userInfo);
    console.log('User Role:', userRole);
    console.log('Is Merchant:', isMerchant);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>

                {!userInfo ? (

                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                    />
                ) : (

                    <>
                        <Stack.Screen
                            name="Main"
                            component={DrawerNavigation}
                            initialParams={{ isMerchant }}
                        />

                        {!isMerchant && (
                            <Stack.Screen
                                name="ScanLogin"
                                component={ScannerScreen}
                            />
                        )}
                        <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}