import { StyleSheet, Text, View, Dimensions, StatusBar, ScrollView, Animated, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useIsFocused } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import Header from '../../components/Header';
import { API_BASE_URL } from '../../config';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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

const getStatusConfig = (statusCode) => {
    switch (statusCode) {
        case 0: return { label: 'UPCOMING', color: '#FFAA00' };
        case 1: return { label: 'ACTIVE', color: '#00E5A0' };
        case 2: return { label: 'ONGOING', color: '#00C2FF' };
        case 3: return { label: 'COMPLETED', color: '#4B4B4B' };
        default: return { label: 'CANCELLED', color: '#FF4D6A' };
    }
};

export default function EventOrganizerScreen({ navigation, route }) {
    const { event } = route.params;
    const { userInfo } = useContext(AuthContext);
    const isFocused = useIsFocused();
    const [scanData, setScanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(true);
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);

    const dynamicTotal = tickets.reduce((s, t) => s + (parseInt(t.original_qty) || 0), 0);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(Boolean(state.isConnected));
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, [pulseAnim]);

    useEffect(() => {
        if (isFocused) {
            if (userInfo?.token) {
                fetchScanData();
                fetchEventTickets();
            } else {
                setLoading(false);
                setError('Please login to view scan data');
            }
        }
    }, [isFocused, userInfo]);

    const fetchEventTickets = async () => {
        try {
            if (!userInfo?.token) return;
            const res = await fetch(`${API_BASE_URL}/staff/tickets`, {
                headers: { Authorization: `Bearer ${userInfo.token}`, Accept: 'application/json' },
            });
            if (!res.ok) throw new Error('Failed to fetch tickets');

            const json = await res.json();
            const all = json.data || json.tickets || json;
            
            const filteredTickets = Array.isArray(all) ? all.filter(t => t.event_id == event.id) : [];
            setTickets(filteredTickets);
        } catch (e) {
            console.error('Error fetching tickets:', e);
        } finally {
            setLoadingTickets(false);
        }
    };

    const fetchScanData = async (isRefresh = false) => {
        try {
            if (!isRefresh && !scanData) setLoading(true);
            setError(null);

            if (!isConnected) throw new Error('No internet connection. Reconnect to fetch data.');
            if (!userInfo?.token) throw new Error('Staff session expired. Please log in again.');

            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userInfo.token}`
            };

            const response = await fetch(`${API_BASE_URL}/staff/tickets/scanned?event_id=${event.id}`, {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const backendMessage = errorData.message ? `Backend: ${errorData.message}` : `Error ${response.status}`;
                throw new Error(backendMessage);
            }

            const json = await response.json();
            const scannedCount = typeof json.data === 'number' ? json.data : 0;
            const totalCount = parseInt(event.totalTickets) || 0;
            const scanPercentage = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0;

            setScanData({
                event_id: event.id,
                event_name: event.title || event.event_name || 'Event',
                total_tickets: totalCount,
                scanned_tickets: scannedCount,
                scan_percentage: scanPercentage,
                raw_data: json,
            });

        } catch (err) {
            if (!scanData) setError(err.message || 'Failed to load scan data');
            console.error('Error fetching scan data:', err);
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    };

    const onRefresh = () => {
        if (isConnected) {
            setRefreshing(true);
            fetchScanData(true);
        } else {
            setError('No internet connection.');
        }
    };

    const statusConfig = getStatusConfig(event.statusCode ?? event.status);

    if (loading) {
        return (
            <View style={styles.root}>
                <StatusBar barStyle="light-content" backgroundColor="#050A14" />
                <SafeAreaView style={styles.safeArea}>
                    <Header navigation={navigation} onBack={() => navigation.goBack()} />
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#00E5A0" />
                        <Text style={styles.loadingText}>Loading scan data...</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    if (error && !scanData) {
        return (
            <View style={styles.root}>
                <StatusBar barStyle="light-content" backgroundColor="#050A14" />
                <SafeAreaView style={styles.safeArea}>
                    <Header navigation={navigation} onBack={() => navigation.goBack()} />
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchScanData()}>
                            <Text style={styles.retryText}>RETRY</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const scannedCount = scanData?.scanned_tickets || 0;
    const totalCount = dynamicTotal > 0 ? dynamicTotal : parseInt(event.totalTickets) || 0;
    const scanPercentage = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0;

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#050A14" />
            <SafeAreaView style={styles.safeArea}>
                <Header navigation={navigation} onBack={() => navigation.goBack()} />

                {!isConnected && (
                    <View style={styles.offlineBanner}>
                        <Ionicons name="cloud-offline" size={16} color="#FFD5DB" />
                        <View style={styles.offlineTextContainer}>
                            <Text style={styles.offlineBannerTitle}>OFFLINE</Text>
                            <Text style={styles.offlineBannerText}>Connect to the internet to get live scan updates.</Text>
                        </View>
                    </View>
                )}

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5A0" />}
                >
                    {/* Enhanced Event Header */}
                    <View style={styles.eventHeader}>
                        <View style={styles.headerContent}>
                            <View style={styles.titleRow}>
                                <MaterialCommunityIcons name="calendar-star" size={28} color="#00E5A0" />
                                <View style={styles.titleContainer}>
                                    <Text style={styles.eventTitle} numberOfLines={2}>{event.title || event.event_name}</Text>
                                </View>
                            </View>
                            <View style={styles.venueRow}>
                                <Ionicons name="location-outline" size={16} color="#4A8AAF" />
                                <Text style={styles.eventVenue}>{event.venue || event.event_venue}</Text>
                            </View>
                            <View style={styles.dateRow}>
                                <Ionicons name="time-outline" size={16} color="#4A8AAF" />
                                <Text style={styles.eventMeta}>{event.schedule || `${event.event_date} • ${formatTime(event.event_time)}`}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: statusConfig.color + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                        </View>
                    </View>

                    {/* Prominent Progress Section */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressCard}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressTitle}>Check-in Progress</Text>
                                <Text style={styles.progressPercentage}>{scanPercentage}%</Text>
                            </View>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${scanPercentage}%`,
                                            backgroundColor: scanPercentage >= 75 ? '#00E5A0' : scanPercentage >= 50 ? '#00C2FF' : '#FFAA00'
                                        }
                                    ]}
                                />
                            </View>
                            <View style={styles.progressStats}>
                                <Text style={styles.progressStatsText}>
                                    {scannedCount} of {totalCount} tickets scanned
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Enhanced Stats Grid */}
                    <View style={styles.statsSection}>
                        <Text style={styles.sectionTitle}>Live Analytics</Text>
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, styles.scannedCard]}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="checkmark-circle" size={24} color="#00E5A0" />
                                </View>
                                <View style={styles.statContent}>
                                    <Text style={styles.statValue}>{scannedCount}</Text>
                                    <Text style={styles.statLabel}>Verified Entries</Text>
                                    <Text style={styles.statSubtext}>Successfully scanned</Text>
                                </View>
                            </View>

                            <View style={[styles.statCard, styles.capacityCard]}>
                                <View style={styles.statIconContainer}>
                                    <MaterialCommunityIcons name="chart-pie" size={24} color="#FFAA00" />
                                </View>
                                <View style={styles.statContent}>
                                    <Text style={styles.statValue}>{totalCount}</Text>
                                    <Text style={styles.statLabel}>Total Capacity</Text>
                                    <Text style={styles.statSubtext}>Event capacity</Text>
                                </View>
                            </View>

                            <View style={[styles.statCard, styles.rateCard]}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="trending-up" size={24} color="#FF6B9D" />
                                </View>
                                <View style={styles.statContent}>
                                    <Text style={styles.statValue}>{scanPercentage}%</Text>
                                    <Text style={styles.statLabel}>Scan Rate</Text>
                                    <Text style={styles.statSubtext}>Of total capacity</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050A14' },
    safeArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    // Offline Banner
    offlineBanner: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16,
        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
        backgroundColor: '#3B1118', borderWidth: 1, borderColor: '#6D2430',
    },
    offlineTextContainer: { marginLeft: 12 },
    offlineBannerTitle: { color: '#FFD5DB', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
    offlineBannerText: { color: '#FFB7C2', fontSize: 13 },

    // Enhanced Event Header
    eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    headerContent: { flex: 1, marginRight: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    titleContainer: { flex: 1, marginLeft: 12 },
    eventTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', lineHeight: 28 },
    venueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    eventVenue: { color: '#4A8AAF', fontSize: 15, fontWeight: '600', marginLeft: 8 },
    dateRow: { flexDirection: 'row', alignItems: 'center' },
    eventMeta: { color: '#4A8AAF', fontSize: 14, fontWeight: '500', marginLeft: 8 },
    statusPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },

    // Prominent Progress Section
    progressSection: { marginBottom: 24 },
    progressCard: {
        backgroundColor: '#0B1623', borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: '#132035',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
    },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    progressTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    progressPercentage: { color: '#00E5A0', fontSize: 18, fontWeight: '900' },
    progressTrack: { height: 12, backgroundColor: '#0F1E30', borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
    progressFill: { height: '100%', borderRadius: 6 },
    progressStats: { alignItems: 'center' },
    progressStatsText: { color: '#4A8AAF', fontSize: 14, fontWeight: '600' },

    // Enhanced Stats Section
    statsSection: { marginBottom: 24 },
    sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 16, paddingHorizontal: 4 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
        flex: 1, minWidth: '48%', backgroundColor: '#0B1623', borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: '#132035',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    statIconContainer: { marginBottom: 12 },
    statContent: { alignItems: 'center' },
    statValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
    statLabel: { color: '#4A8AAF', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
    statSubtext: { color: '#4A8AAF', fontSize: 11, fontWeight: '500' },

    // Card specific styles
    scannedCard: { borderColor: '#00E5A0' },
    remainingCard: { borderColor: '#00C2FF' },
    capacityCard: { borderColor: '#FFFFFF' },
    rateCard: { borderColor: '#FF6B9D' },

    // Enhanced Status Section
    statusSection: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
    statusIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1623', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: '#132035' },
    statusMessage: { color: '#4A8AAF', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginLeft: 12 },
    pulseOrb: {
        width: 10, height: 10, borderRadius: 5, backgroundColor: '#00E5A0',
        shadowColor: '#00E5A0', shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
    },

    // Center Container (Loading/Error)
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 16, fontSize: 14, color: '#4A8AAF', fontWeight: '600', letterSpacing: 1 },
    errorText: { fontSize: 14, color: '#FF4D6A', textAlign: 'center', fontWeight: '600', marginBottom: 16 },
    retryBtn: { borderRadius: 20, borderWidth: 1, borderColor: '#132035', paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#0B1623' },
    retryText: { color: '#4A8AAF', fontSize: 12, fontWeight: '800' }
});