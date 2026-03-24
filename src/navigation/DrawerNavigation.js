import { createDrawerNavigator } from '@react-navigation/drawer';
import { useContext } from 'react';
import ScannerScreen from "../screens/ScannerScreen";
import HomeScreen from "../screens/HomeScreen";
import EventScreen from "../screens/EventScreen";
import AttendeeTrackScreen from '../screens/AttendeeTrackScreen';
import { AuthContext } from '../context/AuthContext';

const Drawer = createDrawerNavigator();

export default function DrawerNavigation({ route }) {
    const { userInfo } = useContext(AuthContext);
    
    // Check if user is a merchant (handle different API response structures)
    const userRole = userInfo?.role || userInfo?.user?.role || userInfo?.type;
    const isMerchant = userRole === 'merchant';
    
    console.log('Drawer - User Info:', userInfo);
    console.log('Drawer - User Role:', userRole);
    console.log('Drawer - Is Merchant:', isMerchant);

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

            {isMerchant && (
                <>
                    <Drawer.Screen
                        name="Scanner"
                        component={ScannerScreen}
                        options={{ title: "Ticket Scanner" }}
                    />

                    <Drawer.Screen
                        name="Event"
                        component={EventScreen}
                        options={{ title: "Event Management" }}
                    />

                    <Drawer.Screen
                        name="AttendeeTrack"
                        component={AttendeeTrackScreen}
                        options={{ title: "Attendee Tracking" }}
                    />
                </>
            )}
        </Drawer.Navigator>
    );
}