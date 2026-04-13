import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Animated, Dimensions, StatusBar, Image, Alert, Platform, FlatList, Modal, ActivityIndicator } from 'react-native'
import { Entypo, MaterialIcons, Foundation } from '@expo/vector-icons'
import React, { useState, useRef, useEffect, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../../context/AuthContext'
import Header from '../../components/Header'
import { API_BASE_URL, IMAGE_BASE_URL } from '../../config';

const { width, height } = Dimensions.get('window')

// Helper to format HH:mm:ss to h:mm AM/PM
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

const getTierColor = (type, name) => {
    const t = String(type || name || '').toLowerCase();
    if (t.includes('gold') || t.includes('vip')) return '#FFD700';
    if (t.includes('silver')) return '#C0C0C0'; 
    if (t.includes('bronze')) return '#CD7F32'; 
    if (t.includes('platinum')) return '#E5E4E2'; 
    if (t.includes('early')) return '#00E5A0'; 
    if (t.includes('gen') || t.includes('standard') || t.includes('regular')) return '#00C2FF'; 
    return '#132035';
};

export default function AttendeeEventDetailsScreen({ navigation, route }) {
    const { userInfo, logout } = useContext(AuthContext);
    const { event } = route.params || {};

    const [expandedArtist, setExpandedArtist] = useState(null);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);

    // Initial event data from params or defaults
    const displayEvent = {
        title: event?.event_name,
        banner: event?.event_image_url || getImageUrl(event?.event_image),
        date: event?.event_date,
        time: event?.event_time,
        venue: event?.event_venue,
        category: event?.category,
        description: event?.description
    };

    const seatMap = event?.seat_plan_url;

    useEffect(() => {
        if (event?.id && userInfo?.token) {
            fetchEventTickets();
        } else {
            setLoadingTickets(false);
        }
    }, [event, userInfo]);

    const fetchEventTickets = async () => {
        try {
            if (!userInfo?.token) return;
            setLoadingTickets(true);
            const response = await fetch(`${API_BASE_URL}/users/tickets`, {
                headers: {
                    "Authorization": `Bearer ${userInfo.token}`,
                    "Accept": "application/json"
                }
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const json = await response.json();
            const all = json.data || json.tickets || json;

            // Filter tickets for this specific event
            setTickets(Array.isArray(all) ? all.filter(t => String(t.event_id) === String(event.id)) : []);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() }
        ]);
    };

    const renderHeader = () => (
        <Header navigation={navigation} onBack={() => navigation.goBack()} />
    );

    const artists = event?.artists || [];

    const renderArtistCard = ({ item }) => {
        const isExpanded = expandedArtist === item.id;
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.artistCard}
                onPress={() => setExpandedArtist(isExpanded ? null : item.id)}
            >
                <Image source={{ uri: item.image }} style={styles.artistPhoto} />
                <View style={[styles.artistInfoBar, isExpanded && { backgroundColor: 'rgba(5, 10, 20, 0.95)' }]}>
                    <Text style={styles.artistName}>{item.name}</Text>
                    <Text style={styles.artistRole}>{item.role}</Text>
                    {isExpanded && (
                        <Text style={styles.artistBioTextSmall}>{item.bio}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <View style={styles.bgGlass1} />
            <View style={styles.bgGlass2} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {renderHeader()}

                <View style={styles.main}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Event Header */}
                        <View style={styles.banner}>
                            <Image
                                source={{ uri: displayEvent.banner }}
                                style={styles.bannerImage}
                            />
                            <View style={[styles.bannerOverlay, { backgroundColor: 'rgba(5, 10, 20, 0.7)' }]} />
                            <View style={styles.bannerContent}>
                                {(event.category) && (
                                    <View style={styles.categoryTag}>
                                        <Text style={styles.categoryTagText}>
                                            {(event.category).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.eventTitle}>{displayEvent.title}</Text>
                                <View style={styles.heroMetaRow}>
                                    <View style={styles.heroMetaItem}>
                                        <Foundation name="marker" size={13} color="#00C2FF" />
                                        <Text style={styles.heroMetaText}>{displayEvent.venue || 'TBA'}</Text>
                                    </View>
                                    <View style={styles.heroMetaItem}>
                                        <Foundation name="calendar" size={13} color="#00C2FF" />
                                        <Text style={styles.heroMetaText}>{displayEvent.date}</Text>
                                    </View>
                                    <View style={styles.heroMetaItem}>
                                        <Foundation name="clock" size={13} color="#00C2FF" />
                                        <Text style={styles.heroMetaText}>{formatTime(displayEvent.time)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* About Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>ABOUT EVENT</Text>
                        </View>
                        <Text
                            style={styles.aboutText}
                            numberOfLines={isAboutExpanded ? undefined : 3}
                        >
                            {displayEvent.description || 'Join the ultimate experience at this event. Featuring world-class production and emotional journeys through sound.'}
                        </Text>
                        {(displayEvent.description && displayEvent.description.length > 150) && (
                            <TouchableOpacity
                                onPress={() => setIsAboutExpanded(!isAboutExpanded)}
                                style={styles.readMoreBtn}
                            >
                                <Text style={styles.readMoreText}>
                                    {isAboutExpanded ? 'View Less' : 'View More'}
                                </Text>
                                <View style={[styles.arrowIcon, isAboutExpanded && styles.arrowRotated]} />
                            </TouchableOpacity>
                        )}

                        {/* Line-up Gallery */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>LINE-UP</Text>
                        </View>
                        <FlatList
                            data={artists}
                            horizontal
                            renderItem={renderArtistCard}
                            keyExtractor={item => item.id?.toString() || Math.random().toString()}
                            contentContainerStyle={styles.artistList}
                            showsHorizontalScrollIndicator={false}
                            ListEmptyComponent={<Text style={styles.emptyText}>No artists listed</Text>}
                        />

                        {/* Seating Chart */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>SEATING PLAN</Text>
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.seatMapCard}
                            onPress={() => setIsMapVisible(true)}
                        >
                            <Image source={{ uri: seatMap }} style={styles.seatMapImage} />
                        </TouchableOpacity>

                        {/* Tier Selection */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>TICKET TIERS</Text>
                        </View>
                        {loadingTickets ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#00C2FF" />
                                <Text style={[styles.loadingText, { color: '#00C2FF' }]}>Loading ticket tiers…</Text>
                            </View>
                        ) : tickets.length > 0 ? tickets.map(tier => {
                            const isAvailable = tier.quantity > 0;
                            const tierColor = getTierColor(tier.type, tier.name);
                            return (
                                <View key={tier.id} style={[styles.passCard, { borderColor: tierColor }]}>
                                    <View style={styles.passTop}>
                                        <View style={styles.passHeader}>
                                            <Text style={styles.passTitle}>{tier.name.toUpperCase()}</Text>
                                            <View style={[styles.passBadge, { borderColor: isAvailable ? 'rgba(0, 229, 160, 0.3)' : 'rgba(255, 87, 51, 0.3)' }]}>
                                                <Text style={[styles.passBadgeText, { color: isAvailable ? '#00E5A0' : '#FF5733' }]}>
                                                    {isAvailable ? 'AVAILABLE' : 'SOLD OUT'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.passType, { color: tierColor !== '#132035' ? tierColor : '#7E97B3' }]}>{tier.type || 'ADMISSION ENTRY'}</Text>
                                        
                                        <View style={styles.passInclusionsRow}>
                                            <Foundation name="check" size={12} color="#4A8AAF" style={{ marginTop: 2 }} />
                                            <Text style={styles.passInclusionsText}>{tier.inclusions}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.passDividerRow}>
                                        <View style={[styles.notchLeft, { borderColor: tierColor }]} />
                                        <View style={styles.dashedLine} />
                                        <View style={[styles.notchRight, { borderColor: tierColor }]} />
                                    </View>

                                    <View style={styles.passBottom}>
                                        <Text style={styles.passPriceLabel}>TICKET PRICE</Text>
                                        <Text style={styles.passPriceValue}>₱{(tier.price || 0).toLocaleString()}</Text>
                                    </View>
                                </View>
                            );
                        }) : (
                            <Text style={styles.emptyText}>No ticket tiers available</Text>
                        )}

                        <View style={{ height: 120 }} />
                    </ScrollView>
                </View>
            </SafeAreaView>

            {/* Seat Map Modal */}
            <Modal visible={isMapVisible}
                transparent
                animationType="fade">
                <View style={styles.modalBg}>
                    <TouchableOpacity style={styles.modalClose} onPress={() => setIsMapVisible(false)}>
                        <Text style={styles.modalCloseText}>✕ CLOSE</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: seatMap }} style={styles.modalImage} resizeMode="contain" />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050A14' },
    safeArea: { flex: 1 },
    main: { flex: 1 },

    // Branded Header (AttendeeHomeScreen Style)
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
    bgGlass1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: '#00C2FF', top: -100, right: -100, opacity: 0.04 },
    bgGlass2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#FF5733', bottom: -50, left: -100, opacity: 0.03 },

    scrollContent: { paddingBottom: 40 },

    // Event Header
    banner: { height: height * 0.28, width: '100%', position: 'relative' },
    bannerImage: { width: '100%', height: '100%' },
    bannerOverlay: { ...StyleSheet.absoluteFillObject },
    bannerContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    categoryTag: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginBottom: 8 },
    categoryTagText: { color: '#050A14', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    eventTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', marginBottom: 12 },
    heroMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
    heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    heroMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#4A8AAF' },
    heroMetaText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

    sectionHeader: { paddingHorizontal: 20, marginTop: 40, marginBottom: 16 },
    sectionTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
    // Artist Cards
    artistList: { paddingHorizontal: 15 },
    artistCard: { width: 150, height: 210, borderRadius: 20, overflow: 'hidden', marginHorizontal: 5, backgroundColor: '#0B1623' },
    artistPhoto: { width: '100%', height: '100%' },
    artistInfoBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(5, 10, 20, 0.7)' },
    artistName: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    artistRole: { color: '#00C2FF', fontSize: 8, fontWeight: '600' },
    artistBioTextSmall: { color: '#A0AEC0', fontSize: 9, marginTop: 6, lineHeight: 13 },
    // About Section
    aboutText: { color: '#A0AEC0', fontSize: 14, lineHeight: 24, letterSpacing: 0.3, paddingHorizontal: 20, paddingTop: 4 },
    // Seat Map
    seatMapCard: { marginHorizontal: 20, height: 180, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0B1623', borderWidth: 1, borderColor: '#132035' },
    seatMapImage: { width: '100%', height: '100%', opacity: 0.6 },
    mapOverlay: { position: 'absolute', bottom: 15, left: 0, right: 0, alignItems: 'center' },
    mapHint: { color: '#FFF', fontSize: 11, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },

    // Modern Boarding Pass Style (Clean/Minimal)
    passCard: {
        marginHorizontal: 20, backgroundColor: 'rgba(11, 22, 35, 0.5)', borderRadius: 16, marginBottom: 16, 
        borderWidth: 1, borderColor: '#132035', overflow: 'hidden'
    },
    passTop: { padding: 16, paddingBottom: 12 },
    passHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    passTitle: { flexShrink: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    passBadge: { backgroundColor: 'transparent', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 10 },
    passBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
    passType: { color: '#7E97B3', fontSize: 11, fontWeight: '600', marginBottom: 12 },
    
    passInclusionsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    passInclusionsText: { flex: 1, color: '#A0AEC0', fontSize: 11, lineHeight: 16 },

    passDividerRow: { flexDirection: 'row', alignItems: 'center', height: 16, position: 'relative' },
    notchLeft: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#050A14', position: 'absolute', left: -9, zIndex: 2, borderWidth: 1, borderColor: '#132035' },
    notchRight: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#050A14', position: 'absolute', right: -9, zIndex: 2, borderWidth: 1, borderColor: '#132035' },
    dashedLine: { flex: 1, height: 1, marginHorizontal: 16, borderTopWidth: 1, borderColor: '#1A2A44', borderStyle: 'dashed' },

    passBottom: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    passPriceLabel: { color: '#4A5568', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    passPriceValue: { color: '#00C2FF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    passActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    passActionText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(5, 10, 20, 0.98)', justifyContent: 'center', alignItems: 'center' },
    modalClose: { position: 'absolute', top: 60, right: 30 },
    modalCloseText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
    // Description Toggle
    readMoreBtn: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
    readMoreText: { color: '#00C2FF', fontSize: 13, fontWeight: '700' },
    arrowIcon: { width: 7, height: 7, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#00C2FF', transform: [{ rotate: '45deg' }], marginTop: -2 },
    arrowRotated: { transform: [{ rotate: '225deg' }], marginTop: 2 },
    modalImage: { width: '90%', height: '70%' },
    modalHint: { color: '#4A5568', fontSize: 12, marginTop: 20 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 10 },
    loadingText: { fontSize: 14, fontWeight: '600' },
    emptyText: { color: '#3D6080', fontSize: 14, fontStyle: 'italic', paddingHorizontal: 20, marginTop: 10 }
});