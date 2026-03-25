import { createDrawerNavigator } from '@react-navigation/drawer';
import { useContext } from 'react';
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

    // Check if user is a merchant (handle different API response structures)
    const userRole = userInfo?.role || userInfo?.user?.role || userInfo?.type;
    const isMerchant = userRole === 'merchant';

    console.log('Drawer - User Info:', userInfo);
    console.log('Drawer - User Role:', userRole);
    console.log('Drawer - Is Merchant:', isMerchant);

    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: false,
                // drawerType: "slide",
                drawerStyle: { width: "60%" }
            }}
        >

            {/* MERCHANT ROLE */}
            {userRole === 'merchant' ? (
                <>
                    <Drawer.Screen
                        name="MerchantHome"
                        component={MerchantHomeScreen}
                        options={{ title: "Dashboard" }}
                    />
                    <Drawer.Screen
                        name="MerchantScanner"
                        component={ScannerScreen}
                        options={{ title: "Ticket Scanner" }}
                    />
                    <Drawer.Screen
                        name="MerchantEvent"
                        component={EventScreen}
                        options={{ title: "Event Management" }}
                    />
                    <Drawer.Screen
                        name="MerchantAttendeeTrack"
                        component={AttendeeTrackScreen}
                        options={{ title: "Track Attendee" }}
                    />
                </>
            ) : null}
            {/* STAFF ROLE */}
            {userRole === 'staff' ? (
                <>
                    <Drawer.Screen
                        name="OrganizerHome"
                        component={OrganizerHomeScreen}
                        options={{ title: "Dashboard" }}
                    />
                    <Drawer.Screen
                        name="StaffManageEvent"
                        component={ManageEventScreen}
                        options={{ title: "Manage Events" }}
                    />
                </>
            ) : null}

            {/* CUSTOMER ROLE */}
            {userRole === 'user' ? (
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
            ) : null}
        </Drawer.Navigator>
    );
}