import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import DrawerNavigation from "./DrawerNavigation";
import ScannerScreen from '../screens/ScannerScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                />

                <Stack.Screen
                    name="Main"
                    component={DrawerNavigation}
                />

                <Stack.Screen
                    name="ScanLogin"
                    component={ScannerScreen}
                />

            </Stack.Navigator>
        </NavigationContainer>
    );
}