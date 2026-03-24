import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from 'react';
import LoginScreen from "../screens/auth/LoginScreen";
import DrawerNavigation from "./DrawerNavigation";
import ScannerScreen from '../screens/ScannerScreen';
import { AuthContext } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function Navigation() {
    const { userInfo } = useContext(AuthContext);
    
    // Check if user is a merchant (handle different API response structures)
    const userRole = userInfo?.role || userInfo?.user?.role || userInfo?.type;
    const isMerchant = userRole === 'merchant' || userRole === 'admin';
    
    console.log('User Info:', userInfo);
    console.log('User Role:', userRole);
    console.log('Is Merchant:', isMerchant);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                
                {!userInfo ? (
                    // Show login if not authenticated
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                    />
                ) : (
                    // Show main app if authenticated
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
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}