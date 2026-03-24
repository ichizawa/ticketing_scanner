import { createDrawerNavigator } from '@react-navigation/drawer';
import ScannerScreen from "../screens/ScannerScreen";
import HomeScreen from "../screens/HomeScreen";
import EventScreen from "../screens/EventScreen";
import AttendeeTrackScreen from '../screens/AttendeeTrackScreen';

const Drawer = createDrawerNavigator();

export default function DrawerNavigation() {
    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: true,
                // drawerType: "slide",
                drawerStyle: { width: "60%" }
            }}
        >
            <Drawer.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: "Dashboard" }}
            />

            <Drawer.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{ title: "Ticket Scanner" }}
            />
        </Drawer.Navigator>
    );
}