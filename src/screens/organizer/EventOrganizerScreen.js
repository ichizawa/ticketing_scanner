import { StyleSheet, Text, View, Dimensions, StatusBar, ScrollView, Animated, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
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

const getStatusConfig = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('UPCOMING')) return { label: 'UPCOMING', color: '#FFAA00' };
    if (s.includes('ONGOING') || s.includes('LIVE')) return { label: 'ONGOING', color: '#FF4D6A' };
    if (s.includes('ACTIVE')) return { label: 'ACTIVE', color: '#00E5A0' };
    if (s.includes('COMPLETED') || s.includes('PAST')) return { label: 'COMPLETED', color: '#4A5568' };
    if (s.includes('CANCELLED')) return { label: 'CANCELLED', color: '#FF5733' };
    
    const code = parseInt(status);
    switch (code) {
        case 0: return { label: 'UPCOMING', color: '#FFAA00' };
        case 1: return { label: 'ACTIVE', color: '#00E5A0' };
        case 2: return { label: 'ONGOING', color: '#FF4D6A' };
        case 3: return { label: 'COMPLETED', color: '#4A5568' };
        default: return { label: s || 'ACTIVE', color: '#00E5A0' };
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
                    {/* Event Header — attendee style */}
                    <View style={styles.eventHeader}>
                        <Image
                            source={{ uri: event.imageUrl || event.event_image_url }}
                            style={styles.bannerImage}
                        />
                        <View style={[styles.bannerOverlay, { backgroundColor: 'rgba(5, 10, 20, 0.65)' }]} />
                        <View style={styles.bannerContent}>
                            <View style={styles.bannerTopRow}>
                                {event.category ? (
                                    <View style={styles.categoryTag}>
                                        <Text style={styles.categoryTagText}>{String(event.category).toUpperCase()}</Text>
                                    </View>
                                ) : <View />}
                            </View>
                            <Text style={styles.eventTitle} numberOfLines={2}>{event.title || event.event_name}</Text>
                            <View style={styles.heroMetaRow}>
                                <View style={styles.heroMetaItem}>
                                    <Ionicons name="location-outline" size={13} color="#00C2FF" />
                                    <Text style={styles.heroMetaText}>{event.venue || event.event_venue || 'TBA'}</Text>
                                </View>
                                <View style={styles.heroMetaItem}>
                                    <Ionicons name="calendar-outline" size={13} color="#00C2FF" />
                                    <Text style={styles.heroMetaText}>{event.date || event.event_date}</Text>
                                </View>
                                <View style={styles.heroMetaItem}>
                                    <Ionicons name="time-outline" size={13} color="#00C2FF" />
                                    <Text style={styles.heroMetaText}>{event.time || formatTime(event.event_time)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Live Analytics */}
                    <View style={styles.statsSection}>
                        <Text style={styles.sectionTitle}>Live Analytics</Text>
                        <View style={styles.statsBar}>
                            <View style={styles.statItem}>
                                <Ionicons name="checkmark-circle" size={18} color="#00E5A0" style={{ marginBottom: 4 }} />
                                <Text style={[styles.statValue, { color: '#00E5A0' }]}>{scannedCount.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>SCANNED</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={[styles.statItem, { flex: 1.4 }]}>
                                <MaterialCommunityIcons name="chart-pie" size={18} color="#FFAA00" style={{ marginBottom: 4 }} />
                                <Text style={[styles.statValue, { color: '#FFF', fontSize: 22 }]}>{totalCount.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>CAPACITY</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Ionicons name="trending-up" size={18} color="#FF6B9D" style={{ marginBottom: 4 }} />
                                <Text style={[styles.statValue, { color: '#FF6B9D' }]}>{scanPercentage}%</Text>
                                <Text style={styles.statLabel}>SCAN RATE</Text>
                            </View>
                        </View>
                    </View>

                    {/* Check-in Counter Card */}
                    <View style={[styles.progressSection, { shadowColor: scanPercentage >= 75 ? '#00E5A0' : scanPercentage >= 50 ? '#00C2FF' : '#FFAA00' }]}>
                        <View style={styles.progressCard}>
                            <View style={styles.progressHeader}>
                                <View>
                                    <Text style={styles.progressTitle}>TOTAL CHECKED IN</Text>
                                    <Text style={styles.progressCountBig}>
                                        {scannedCount.toLocaleString()}
                                        <Text style={styles.progressCountSub}> / {totalCount > 0 ? totalCount.toLocaleString() : '\u221e'}</Text>
                                    </Text>
                                </View>
                                <View style={[styles.pctBadge, {
                                    borderColor: (scanPercentage >= 75 ? '#00E5A0' : scanPercentage >= 50 ? '#00C2FF' : '#FFAA00') + '50',
                                    backgroundColor: (scanPercentage >= 75 ? '#00E5A0' : scanPercentage >= 50 ? '#00C2FF' : '#FFAA00') + '15'
                                }]}>
                                    <Text style={[styles.pctBadgeText, { color: scanPercentage >= 75 ? '#00E5A0' : scanPercentage >= 50 ? '#00C2FF' : '#FFAA00' }]}>{scanPercentage}%</Text>
                                </View>
                            </View>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, {
                                    width: `${scanPercentage}%`,
                                    backgroundColor: scanPercentage >= 75 ? '#00E5A0' : scanPercentage >= 50 ? '#00C2FF' : '#FFAA00'
                                }]} />
                            </View>
                            <View style={styles.progressStats}>
                                <Text style={styles.progressStatLeft}>{Math.max(0, totalCount - scannedCount).toLocaleString()} remaining</Text>
                                <Text style={styles.progressStatsText}>Live Check-in Rate</Text>
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

    // Event Header — attendee style (edge-to-edge)
    eventHeader: { marginHorizontal: -20, marginBottom: 24, height: 240, position: 'relative' },
    bannerImage: { width: '100%', height: '100%' },
    bannerOverlay: { ...StyleSheet.absoluteFillObject },
    bannerContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    bannerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    categoryTag: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    categoryTagText: { color: '#050A14', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    eventTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 10, lineHeight: 30 },
    heroMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
    heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    heroMetaText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

    // Prominent Progress Section
    progressSection: { marginBottom: 20, elevation: 10, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
    progressCard: {
        backgroundColor: '#0B1623', borderRadius: 24, padding: 22,
        borderWidth: 1, borderColor: '#132035',
    },
    progressHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    progressTitle:     { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
    progressCountBig:  { color: '#FFF', fontSize: 32, fontWeight: '800' },
    progressCountSub:  { color: '#3D6080', fontSize: 20, fontWeight: '600' },
    pctBadge:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    pctBadgeText:      { fontSize: 18, fontWeight: '900' },
    progressTrack:     { height: 10, backgroundColor: '#132035', borderRadius: 5, overflow: 'hidden', marginVertical: 14 },
    progressFill:      { height: '100%', borderRadius: 5 },
    progressStats:     { flexDirection: 'row', justifyContent: 'space-between' },
    progressStatLeft:  { color: '#FFF', fontSize: 12, fontWeight: '600' },
    progressStatsText: { color: '#3D6080', fontSize: 12, fontWeight: '600' },
    progressPercentage:{ color: '#00E5A0', fontSize: 18, fontWeight: '900' },

    // Stats Bar — mirrors MerchantHomeScreen statsBar
    statsSection: { marginBottom: 24 },
    sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 16, paddingHorizontal: 4 },
    statsBar: {
        flexDirection: 'row', backgroundColor: '#0B1623', borderRadius: 14, paddingVertical: 12,
        borderWidth: 1, borderColor: '#00C2FF',
    },
    statItem:    { flex: 1, alignItems: 'center' },
    statValue:   { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
    statLabel:   { color: '#3D6080', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
    statDivider: { width: 1, backgroundColor: '#00C2FF', marginVertical: 6 },

    // (kept for unused style refs)
    statCard:       { flex: 1, minWidth: '48%', backgroundColor: '#0B1623', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#132035' },
    statIconContainer: { marginBottom: 12 },
    statContent:    { alignItems: 'center' },
    statSubtext:    { color: '#4A8AAF', fontSize: 11, fontWeight: '500' },
    scannedCard:    { borderColor: '#00E5A0' },
    remainingCard:  { borderColor: '#00C2FF' },
    capacityCard:   { borderColor: '#FFFFFF' },
    rateCard:       { borderColor: '#FF6B9D' },

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