import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert, StatusBar, ImageBackground } from 'react-native'
import React, { useContext } from 'react'
import { AuthContext } from './context/AuthContext';

export default function Profile({ navigation }) {
    const { userDetails, logout } = useContext(AuthContext);
    const handleOptionPress = (option) => {
        // Alert.alert('Feature Access', `Opening: ${option}`)
        // console.info(`Data: ${JSON.stringify(userDetails)}`);

        switch (option) {
            case 11:
                // Sign out logic
                logout(userDetails);
                break;
            default:
                Alert.alert('Feature Access', 'In development, comming soon! ')
                break;
        }
    }

    const scannerOptions = [
        { id: 1, title: 'Scanner Settings', icon: '⚙️', subtitle: 'Configure scan preferences' },
        { id: 2, title: 'Event Management', icon: '🎫', subtitle: 'Manage assigned events' },
        { id: 3, title: 'Scan History', icon: '📊', subtitle: 'View scanning statistics' },
        { id: 4, title: 'Offline Mode', icon: '📱', subtitle: 'Download events for offline scanning' },
        { id: 5, title: 'Reports & Analytics', icon: '📈', subtitle: 'Generate scan reports' },
        { id: 6, title: 'Device Sync', icon: '🔄', subtitle: 'Sync with other devices' },
    ]

    const accountOptions = [
        { id: 7, title: 'Account Settings', icon: '👤', subtitle: 'Update profile information' },
        { id: 8, title: 'Security', icon: '🔐', subtitle: 'Password & authentication' },
        { id: 9, title: 'Notifications', icon: '🔔', subtitle: 'Alert preferences' },
        { id: 10, title: 'Help & Support', icon: '💬', subtitle: 'Get assistance' },
        { id: 11, title: 'Sign Out', icon: '🚪', subtitle: 'Exit the application', isLogout: true },
    ]

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerGradient}>
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: 'https://via.placeholder.com/100x100/16213e/FFFFFF?text=MJ' }}
                                style={styles.avatar}
                            />
                            <View style={styles.statusBadge}>
                                <View style={styles.onlineIndicator} />
                            </View>
                        </View>

                        <Text style={styles.userName}>{userDetails?.first_name + ' ' + userDetails?.last_name}</Text>
                        <Text style={styles.userRole}>{userDetails?.role_type == 2 ? 'Staff' : 'Admin'}</Text>
                        <Text style={styles.userLocation}>{userDetails?.email}</Text>
                    </View>
                </View>
            </View>
            <ImageBackground
                source={require('../assets/bg.png')}
                style={styles.container}
                resizeMode="cover"
            >
                <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Scanner Tools</Text>
                        {scannerOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.optionItem}
                                onPress={() => handleOptionPress(option.title)}
                            >
                                <View style={styles.optionIconContainer}>
                                    <Text style={styles.optionIcon}>{option.icon}</Text>
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionTitle}>{option.title}</Text>
                                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                                </View>
                                <Text style={styles.optionArrow}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Account Options */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Account</Text>
                        {accountOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionItem,
                                    option.isLogout && styles.logoutItem
                                ]}
                                onPress={() => handleOptionPress(option.id)}
                            >
                                <View style={[
                                    styles.optionIconContainer,
                                    option.isLogout && styles.logoutIconContainer
                                ]}>
                                    <Text style={styles.optionIcon}>{option.icon}</Text>
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={[
                                        styles.optionTitle,
                                        option.isLogout && styles.logoutText
                                    ]}>
                                        {option.title}
                                    </Text>
                                    <Text style={[
                                        styles.optionSubtitle,
                                        option.isLogout && styles.logoutSubtext
                                    ]}>
                                        {option.subtitle}
                                    </Text>
                                </View>
                                <Text style={styles.optionArrow}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* App Info */}
                    <View style={styles.appInfoContainer}>
                        <Text style={styles.appName}>Mediaonetix</Text>
                        <Text style={styles.appVersion}>Version 1.0.0 • Build 001</Text>
                        {/* <Text style={styles.lastSync}>Last sync: 2 minutes ago</Text> */}
                    </View>
                </ScrollView>
            </ImageBackground>
        </View>

    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    headerContainer: {
        backgroundColor: '#1a1a2e',
    },
    headerGradient: {
        backgroundColor: '#16213e',
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 0,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#4a90e2',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 3,
    },
    onlineIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2ecc71',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    userRole: {
        fontSize: 16,
        color: '#4a90e2',
        marginBottom: 5,
        fontWeight: '600',
    },
    userLocation: {
        fontSize: 14,
        color: '#bbb',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 15,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#4a90e2',
        fontWeight: '600',
        marginBottom: 2,
    },
    statSubtext: {
        fontSize: 10,
        color: '#bbb',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        marginBottom: 30,
        gap: 15,
    },
    quickActionBtn: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e1e8ed',
    },
    primaryAction: {
        backgroundColor: '#4a90e2',
        borderColor: '#4a90e2',
    },
    quickActionIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    sectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginTop: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    optionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionIcon: {
        fontSize: 18,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 13,
        color: '#666',
    },
    optionArrow: {
        fontSize: 18,
        color: '#ccc',
        marginLeft: 10,
    },
    logoutItem: {
        borderBottomWidth: 0,
    },
    logoutIconContainer: {
        backgroundColor: '#ffe6e6',
    },
    logoutText: {
        color: '#e74c3c',
    },
    logoutSubtext: {
        color: '#e74c3c',
        opacity: 0.7,
    },
    appInfoContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        // paddingBottom: 40,
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4a90e2',
        marginBottom: 5,
    },
    appVersion: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    lastSync: {
        fontSize: 11,
        color: '#999',
    },
});