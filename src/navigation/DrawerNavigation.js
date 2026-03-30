import { createDrawerNavigator } from '@react-navigation/drawer';
import { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Example Icon import - you can uncomment and use your own vector icons (e.g., Ionicons, MaterialIcons)
// import Icon from 'react-native-vector-icons/Ionicons'; 

import ScannerScreen from "../screens/organizer/ScannerScreen";
import HomeScreen from "../screens/attendee/AttendeeHomeScreen";
import MerchantHomeScreen from "../screens/merchant/MerchantHomeScreen";
import OrganizerHomeScreen from "../screens/organizer/OrganizerHomeScreen";
import EventScreen from "../screens/organizer/EventScreen";
import ManageEventScreen from "../screens/merchant/ManageEventScreen";
import AttendeeTrackScreen from '../screens/organizer/AttendeeTrackScreen';
import HistoryScreen from '../screens/attendee/HistoryScreen';
import PurchaseScreen from '../screens/attendee/PurchaseScreen';
import { AuthContext } from '../context/AuthContext';

const Drawer = createDrawerNavigator();

export default function DrawerNavigation({ route }) {
    const { userInfo } = useContext(AuthContext);

    const userRole = userInfo?.role || userInfo?.user?.role || userInfo?.type;
    const isMerchant = userRole === 'merchant';

    console.log('Drawer - User Info:', userInfo);
    console.log('Drawer - User Role:', userRole);
    console.log('Drawer - Is Merchant:', isMerchant);

    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: false,
                drawerType: "slide",

                drawerStyle: {
                    backgroundColor: '#050A14', 
                    width: "70%", 
                    borderRightWidth: 1,
                    borderRightColor: '#1A2A44',
                },
                
                drawerActiveTintColor: '#00C2FF', 
                drawerInactiveTintColor: '#A0B3C6', 
                drawerActiveBackgroundColor: 'rgba(0, 194, 255, 0.1)', 
                drawerItemStyle: {
                    borderRadius: 12, 
                    marginVertical: 4, 
                    paddingHorizontal: 8,
                },
                drawerLabelStyle: {
                    fontSize: 16,
                    fontWeight: '600',
                    marginLeft: -10, 
                },
            }}
        >

            {/* MERCHANT ROLE */}
            {userRole === 'merchant' && (
                <>
                    <Drawer.Screen
                        name="MerchantHome"
                        component={MerchantHomeScreen}
                        options={{ 
                            title: "Dashboard",
                        }}
                    />
                    <Drawer.Screen
                        name="MerchantManageEvent"
                        component={ManageEventScreen}
                        options={{ 
                            title: "Manage Events",
                        }}
                    />
                </>
            )}

            {/* STAFF ROLE */}
            {userRole === 'staff' && (
                <>
                    <Drawer.Screen
                        name="OrganizerHome"
                        component={OrganizerHomeScreen}
                        options={{ title: "Dashboard" }}
                    />
                    <Drawer.Screen
                        name="OrganizerScanner"
                        component={ScannerScreen}
                        options={{ title: "Ticket Scanner" }}
                    />
                    <Drawer.Screen
                        name="OrganizerEvent"
                        component={EventScreen}
                        options={{ title: "Event Management" }}
                    />
                    <Drawer.Screen
                        name="OrganizerAttendeeTrack"
                        component={AttendeeTrackScreen}
                        options={{ title: "Track Attendee" }}
                    />
                </>
            )}

            {/* CUSTOMER ROLE */}
            {userRole === 'user' && (
                <>
                    <Drawer.Screen
                        name="CustomerHome"
                        component={HomeScreen}
                        options={{ title: "Dashboard" }}
                    />
                    <Drawer.Screen
                        name="CustomerPurchase"
                        component={PurchaseScreen}
                        options={{ title: "Purchase Tickets" }}
                    />
                    <Drawer.Screen
                        name="CustomerHistory"
                        component={HistoryScreen}
                        options={{ title: "Purchase History" }}
                    />
                </>
            )}
        </Drawer.Navigator>
    );
}