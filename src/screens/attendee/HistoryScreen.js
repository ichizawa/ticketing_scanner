import {
    StyleSheet, Text, View, TouchableOpacity, ScrollView,
    Animated, Dimensions, StatusBar, Image, Platform,
    FlatList, Modal
} from 'react-native'
import React, { useState, useRef, useEffect, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../../context/AuthContext'
import { BlurView } from 'expo-blur'
import Header from '../../components/Header'

const { width, height } = Dimensions.get('window')

// --- Mock Data ---
const PURCHASE_HISTORY = [
    {
        id: 'TXN-77291',
        title: 'ASCENSION MUSIC FESTIVAL',
        date: 'MAR 28, 2026',
        venue: 'Philippine Arena',
        status: 'Upcoming',
        image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=400',
        breakdown: [
            { tier: 'SVIP Reserved', qty: 2, price: 12500 },
            { tier: 'Gold Standing', qty: 1, price: 7500 }
        ],
        total: 32500,
        qrToken: 'AUTH-V4-9281-XM2'
    },
    {
        id: 'TXN-66102',
        title: 'ELECTRONIC PARADISE',
        date: 'FEB 15, 2026',
        venue: 'Downtown Arena',
        status: 'Past',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
        breakdown: [
            { tier: 'General Admission', qty: 3, price: 3500 }
        ],
        total: 10500,
        qrToken: 'EXPIRED-772-AL2'
    },
    {
        id: 'TXN-55092',
        title: 'TECH SUMMIT 2026',
        date: 'JAN 20, 2026',
        venue: 'Innovation Hub',
        status: 'Cancelled',
        image: 'https://images.unsplash.com/photo-1540575861501-7c03b177a2a5?auto=format&fit=crop&q=80&w=400',
        breakdown: [
            { tier: 'Delegate Pass', qty: 1, price: 5000 }
        ],
        total: 5000,
        qrToken: null
    }
];

export default function HistoryScreen({ navigation }) {
    const { logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('Upcoming');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [qrVisible, setQrVisible] = useState(false);

    // QR Animation
    const borderAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (qrVisible) {
            // Pulsing border animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(borderAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
                    Animated.timing(borderAnim, { toValue: 0, duration: 1500, useNativeDriver: false })
                ])
            ).start();

            // Simulate Auto-Brightness Trigger
            console.log('HISTORY: Triggering 100% Screen Brightness for QR Scanning');
        } else {
            borderAnim.stopAnimation();
            console.log('HISTORY: Restoring Default Screen Brightness');
        }
    }, [qrVisible]);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() }
        ]);
    };

    const filteredData = PURCHASE_HISTORY.filter(item => item.status === activeTab);

    const renderHeader = () => (
        <Header navigation={navigation} />
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            {['Upcoming', 'Past', 'Cancelled'].map(tab => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    {activeTab === tab && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderOrderCard = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.txnId}>{item.id}</Text>
                    <Text style={styles.orderDate}>{item.date}</Text>
                </View>
                <View style={[styles.statusBadge,
                item.status === 'Upcoming' ? styles.statusUpcoming :
                    item.status === 'Past' ? styles.statusPast : styles.statusCancelled
                ]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.eventInfoRow}>
                <Image source={{ uri: item.image }} style={styles.eventThumb} />
                <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventVenue}>{item.venue}</Text>
                </View>
            </View>

            <View style={styles.breakdownContainer}>
                {item.breakdown.map((b, i) => (
                    <View key={i} style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{b.tier} (x{b.qty})</Text>
                        <Text style={styles.breakdownVal}>₱{(b.price * b.qty).toLocaleString()}</Text>
                    </View>
                ))}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalVal}>₱{item.total.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.receiptBtn}>
                    <Text style={styles.receiptBtnText}>E-Receipt</Text>
                </TouchableOpacity>
                {item.status === 'Upcoming' && (
                    <TouchableOpacity
                        style={styles.viewPassBtn}
                        onPress={() => {
                            setSelectedOrder(item);
                            setQrVisible(true);
                        }}
                    >
                        <Text style={styles.viewPassText}>ENTRY PASS</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const borderColorTransform = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0, 194, 255, 0.2)', 'rgba(0, 194, 255, 1)']
    });

    const borderScaleTransform = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05]
    });

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <View style={styles.bgOrb1} />
            <View style={styles.bgOrb2} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {renderHeader()}

                <View style={styles.pageTitles}>
                    <Text style={styles.mainTitle}>Purchase History</Text>
                    <Text style={styles.subTitle}>Manage your tickets and access entry passes.</Text>
                </View>

                {renderTabs()}

                <FlatList
                    data={filteredData}
                    renderItem={renderOrderCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders found.</Text>
                        </View>
                    }
                />
            </SafeAreaView>

            {/* Advanced QR Pass Modal */}
            <Modal visible={qrVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

                    <View style={styles.qrContainer}>
                        <TouchableOpacity style={styles.closeModal} onPress={() => setQrVisible(false)}>
                            <Text style={styles.closeModalText}>CLOSE</Text>
                        </TouchableOpacity>

                        <Text style={styles.qrTitle}>ENTRY PASS</Text>
                        <Text style={styles.qrSub}>{selectedOrder?.title}</Text>

                        <View style={styles.qrBoxWrapper}>
                            <Animated.View style={[
                                styles.qrLiveBorder,
                                { borderColor: borderColorTransform, transform: [{ scale: borderScaleTransform }] }
                            ]} />
                            <View style={styles.qrWhiteBox}>
                                {/* QR Code Placeholder */}
                                <Image
                                    secondary
                                    source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + selectedOrder?.qrToken }}
                                    style={styles.qrImage}
                                />
                                <View style={styles.qrRefreshRow}>
                                    <View style={styles.refreshDot} />
                                    <Text style={styles.refreshText}>ROTATING SECURE KEY</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.qrSecurityInfo}>
                            <Text style={styles.securityText}>
                                This QR code refreshes every 30 seconds to prevent fraud.
                                Screenshots are not valid for entry.
                            </Text>
                            <View style={styles.brightnessTag}>
                                <Text style={styles.brightnessText}>MAX BRIGHTNESS ACTIVE</Text>
                            </View>
                        </View>

                        <View style={styles.qrOfflineTag}>
                            <Text style={styles.offlineText}>OFFLINE ACCESS ENABLED</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050A14' },
    safeArea: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12
    },
    menuBtn: { width: 40, height: 40, justifyContent: 'center' },
    menuLine: { height: 2, width: 22, backgroundColor: '#FFF', borderRadius: 2, marginVertical: 2.5 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerBranding: { fontSize: 20, fontWeight: '700' },
    headerMedia: { color: '#FFF', fontWeight: '600' },
    headerTix: { color: '#00C2FF', fontWeight: '800' },
    profileBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
    profileAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#132035', borderWidth: 1, borderColor: '#00C2FF30' },

    // Background
    bgOrb1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: '#00C2FF', top: -100, right: -100, opacity: 0.04 },
    bgOrb2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#FF5733', bottom: -50, left: -100, opacity: 0.03 },

    pageTitles: { paddingHorizontal: 20, marginTop: 20 },
    mainTitle: { color: '#FFF', fontSize: 28, fontWeight: '900' },
    subTitle: { color: '#4A5568', fontSize: 13, marginTop: 4 },

    // Tabs
    tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 25, borderBottomWidth: 1, borderBottomColor: '#132035' },
    tab: { paddingVertical: 12, marginRight: 25, position: 'relative' },
    tabText: { color: '#4A5568', fontSize: 13, fontWeight: '700' },
    activeTabText: { color: '#00C2FF' },
    tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#00C2FF' },

    listContent: { padding: 20, paddingBottom: 40 },

    // Order Card
    orderCard: { backgroundColor: '#0B1623', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#132035' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    txnId: { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    orderDate: { color: '#FFF', fontSize: 14, fontWeight: '700', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusUpcoming: { backgroundColor: '#00C2FF20', borderWidth: 1, borderColor: '#00C2FF' },
    statusPast: { backgroundColor: '#4A556820', borderWidth: 1, borderColor: '#4A5568' },
    statusCancelled: { backgroundColor: '#FF573320', borderWidth: 1, borderColor: '#FF5733' },
    statusText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

    eventInfoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#132035', padding: 12, borderRadius: 16 },
    eventThumb: { width: 50, height: 50, borderRadius: 12 },
    eventDetails: { flex: 1, marginLeft: 15 },
    eventTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    eventVenue: { color: '#4A8AAF', fontSize: 11, marginTop: 2 },

    breakdownContainer: { marginTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#132035' },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    breakdownLabel: { color: '#4A5568', fontSize: 12 },
    breakdownVal: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    totalLabel: { color: '#3D6080', fontSize: 13, fontWeight: '800' },
    totalVal: { color: '#00C2FF', fontSize: 18, fontWeight: '900' },

    actionRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
    receiptBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#132035', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E4A62' },
    receiptBtnText: { color: '#00C2FF', fontSize: 12, fontWeight: '800' },
    viewPassBtn: { flex: 1.5, height: 48, borderRadius: 14, backgroundColor: '#00C2FF', alignItems: 'center', justifyContent: 'center' },
    viewPassText: { color: '#050A14', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    emptyContainer: { paddingVertical: 100, alignItems: 'center' },
    emptyText: { color: '#3D6080', fontSize: 14 },

    // Modal UI
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    qrContainer: { width: width * 0.85, backgroundColor: '#0B1623', borderRadius: 40, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#132035' },
    closeModal: { alignSelf: 'flex-end', marginBottom: 10 },
    closeModalText: { color: '#4A5568', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
    qrTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 10 },
    qrSub: { color: '#00C2FF', fontSize: 12, fontWeight: '700', marginTop: 5, textAlign: 'center' },

    qrBoxWrapper: { width: 220, height: 220, marginTop: 40, alignItems: 'center', justifyContent: 'center' },
    qrLiveBorder: { position: 'absolute', width: '100%', height: '100%', borderRadius: 30, borderWidth: 4, borderStyle: 'solid' },
    qrWhiteBox: { width: 190, height: 190, backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    qrImage: { width: 150, height: 150 },
    qrRefreshRow: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, backgroundColor: '#050A14', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    refreshDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E5A0' },
    refreshText: { color: '#4A5568', fontSize: 8, fontWeight: '800' },

    qrSecurityInfo: { marginTop: 30, alignItems: 'center' },
    securityText: { color: '#4A5568', fontSize: 11, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },
    brightnessTag: { backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginTop: 15 },
    brightnessText: { color: '#050A14', fontSize: 9, fontWeight: '900' },

    qrOfflineTag: { marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#132035', width: '100%', alignItems: 'center' },
    offlineText: { color: '#3D6080', fontSize: 9, fontWeight: '800', letterSpacing: 1 }
});