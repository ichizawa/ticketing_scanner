import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Dimensions, StatusBar, Image, Platform, FlatList, Modal, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { Foundation } from '@expo/vector-icons'
import React, { useState, useRef, useEffect, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../../context/AuthContext'
import { BlurView } from 'expo-blur'
import Header from '../../components/Header'
import { API_BASE_URL, IMAGE_BASE_URL } from '../../config';

const { width, height } = Dimensions.get('window')

// --- Helper Functions ---
const formatTime = (time) => {
    if (!time) return 'TBA';
    try {
        const parts = time.split(':');
        if (parts.length < 2) return time;
        let h = parseInt(parts[0], 10);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    } catch (e) {
        return time;
    }
};

const getImageUrl = (path) => {
    if (!path || path === 'null') return null;
    if (path.startsWith('http')) return path;

    const baseUrl = IMAGE_BASE_URL.endsWith('/')
        ? IMAGE_BASE_URL.slice(0, -1)
        : IMAGE_BASE_URL;

    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${baseUrl}/storage/${cleanPath}`;
};

export default function HistoryScreen({ navigation }) {
    const { userInfo, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('Upcoming');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchHistory = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            setError(null);

            if (!userInfo?.token) {
                throw new Error('Not authenticated');
            }

            console.log('Fetching history with token:', userInfo.token.substring(0, 20) + '...');
            console.log('API URL:', `${API_BASE_URL}/users/purchase-history`);

            const response = await fetch(`${API_BASE_URL}/users/purchase-history`, {
                headers: {
                    "Authorization": `Bearer ${userInfo.token}`,
                    "Accept": "application/json"
                }
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const json = await response.json();
            console.log('API Response:', json);

            const eventsList = json.events || [];
            
            // Extract customerTickets and merge with sale (event) data
            let historyData = [];
            if (json.customerTickets && Array.isArray(json.customerTickets)) {
                historyData = json.customerTickets.map(ticket => {
                    const eventId = ticket.sale?.event_id;
                    const eventDetails = eventsList.find(e => e.id === eventId);
                    return {
                    ...ticket,
                    event_name: eventDetails?.event_name,
                    event_date: eventDetails?.event_date,
                    event_time: eventDetails?.event_time,
                    event_venue: eventDetails?.event_venue,
                    event_image: eventDetails?.event_image_url || eventDetails?.event_image,
                    category: eventDetails?.category,
                    status: ticket.sale?.status || ticket.status,
                    status_text: ticket.sale?.status || null,
                    event_id: eventId,
                };
            });
        }
            
            console.log('Parsed history data:', historyData);
            
            setHistory(historyData);
        } catch (err) {
            setError(err.message || 'Failed to load purchase history');
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    };

    useEffect(() => {
        if (userInfo?.token) {
            fetchHistory();
        } else {
            setLoading(false);
        }
    }, [userInfo]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory(true);
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() }
        ]);
    };

    const filteredData = history.filter(item => {
        const itemStatus = item.status?.toString().toLowerCase();
        const tab = activeTab.toLowerCase();

        // Map API statuses to tabs
        if (tab === 'upcoming') {
            return itemStatus === '1' || itemStatus === 'active';
        }
        if (tab === 'past') {
            return itemStatus === '0' || itemStatus === 'past' || itemStatus === 'completed';
        }
        if (tab === 'cancelled') {
            return itemStatus === '3' || itemStatus === 'cancelled';
        }

        return itemStatus === tab;
    });

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

    const renderOrderCard = ({ item }) => {
        const parts = (item.event_date || '2026-01-01').split('-');
        let month = 'JAN', day = '01', year = '2026';
        if (parts.length >= 3) {
            const d = new Date(item.event_date);
            month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            day = d.getDate().toString().padStart(2, '0');
            year = d.getFullYear();
        }

        const isUpcoming = item.status === 1 || item.status === '1' || item.status?.toString().toLowerCase() === 'active';
        const isPast = item.status === 0 || item.status === '0' || item.status?.toString().toLowerCase() === 'past';

        return (
            <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.txnId}>ID: {item.id}</Text>
                    </View>
                    <View style={[styles.statusBadge,
                    isUpcoming ? styles.statusUpcoming :
                        isPast ? styles.statusPast : styles.statusCancelled
                    ]}>
                        <Text style={styles.statusText}>{isUpcoming ? 'ACTIVE' : isPast ? 'NOT ACTIVE' : (item.status_text || 'UNKNOWN').toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <Image
                        source={{ uri: getImageUrl(item.event_image) || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400' }}
                        style={styles.eventThumb}
                    />
                    <View style={styles.eventDetails}>
                        <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>{(item.category || item.type || 'EVENT').toUpperCase()}</Text>
                        </View>
                        <Text style={styles.eventTitle} numberOfLines={1}>{item.event_name}</Text>
                        
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Foundation name="marker" size={11} color="#00C2FF" />
                                <Text style={styles.metaText} numberOfLines={1}>{item.event_venue}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Foundation name="calendar" size={11} color="#00C2FF" />
                                <Text style={styles.metaText}>{item.event_date || 'YYYY-MM-DD'}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Foundation name="clock" size={11} color="#00C2FF" />
                                <Text style={styles.metaText}>{formatTime(item.event_time)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => navigation.navigate('AttendeeEventDetails', { event: { ...item, id: item.event_id } })}
                    >
                        <Text style={styles.detailsBtnText}>VIEW DETAILS</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <View style={styles.bgOrb1} />
            <View style={styles.bgOrb2} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {renderHeader()}

                <View style={styles.pageTitles}>
                    <Text style={styles.mainTitle}>Purchase History</Text>
                    <Text style={styles.subTitle}>Manage your tickets and booking details.</Text>
                </View>

                {renderTabs()}

                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#00C2FF" />
                        <Text style={styles.loadingText}>Syncing history...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        renderItem={renderOrderCard}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#00C2FF"
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No {activeTab.toLowerCase()} purchase found.</Text>
                                {error && <Text style={styles.errorText}>{error}</Text>}
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
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
    orderDate: { color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: 2, opacity: 0.9 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusUpcoming: { backgroundColor: '#00C2FF20', borderWidth: 1, borderColor: '#00C2FF' },
    statusPast: { backgroundColor: '#4A556820', borderWidth: 1, borderColor: '#4A5568' },
    statusCancelled: { backgroundColor: '#FF573320', borderWidth: 1, borderColor: '#FF5733' },
    statusText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16 },
    eventThumb: { width: 50, height: 50, borderRadius: 12 },
    eventDetails: { flex: 1, marginLeft: 15 },
    eventTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    eventVenue: { color: '#4A8AAF', fontSize: 11, marginTop: 2 },

    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { color: '#C0D0E0', fontSize: 11, fontWeight: '700' },

    breakdownContainer: { marginTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#132035' },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    breakdownLabel: { color: '#4A5568', fontSize: 12 },
    breakdownVal: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    totalLabel: { color: '#3D6080', fontSize: 13, fontWeight: '800' },
    totalVal: { color: '#00C2FF', fontSize: 18, fontWeight: '900' },

    actionRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
    emptyContainer: { paddingVertical: 100, alignItems: 'center' },
    emptyText: { color: '#3D6080', fontSize: 14 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#00C2FF', fontSize: 14, marginTop: 15, fontWeight: '700' },
    errorText: { color: '#FF5733', fontSize: 12, marginTop: 10, textAlign: 'center', paddingHorizontal: 40 },

    categoryTag: { alignSelf: 'flex-start', backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginBottom: 8 },
    categoryTagText: { color: '#050A14', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    detailsBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#132035', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E4A62' },
    detailsBtnText: { color: '#00C2FF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }
});
