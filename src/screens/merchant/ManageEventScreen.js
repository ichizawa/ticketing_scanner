import React, { useEffect, useState, useContext, useRef } from 'react';
import { StyleSheet, Text, Alert, View, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar, Image, Animated, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Foundation } from '@expo/vector-icons';
import { API_BASE_URL, IMAGE_BASE_URL } from '../../config';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const formatTime = (time) => {
  if (!time) return 'TBA';
  try {
    const parts = time.split(':');
    if (parts.length < 2) return time;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    h = h % 12 || 12;
    return `${h}:${m}`;
  } catch (e) {
    return time;
  }
};

const getImageUrl = (path) => {
  if (!path || path === 'null') return null;
  if (path.startsWith('http')) return path;

  // Ensure the base URL includes /storage if your API doesn't provide it
  const baseUrl = IMAGE_BASE_URL.endsWith('/') 
    ? IMAGE_BASE_URL.slice(0, -1) 
    : IMAGE_BASE_URL;

  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // If your database path doesn't include 'storage/', add it here:
  return `${baseUrl}/storage/${cleanPath}`;
};

const getStatusColor = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'LIVE' || s === 'ACTIVE' || s === 'ON LIVE') return '#00E5A0';
  if (s === 'COMPLETED' || s === 'DONE LIVE' || s === 'PAST') return '#3D6080';
  return '#00C2FF';
};

// Background decoration component from reference design
const BgDecor = () => (
  <>
    <View style={styles.bgOrb1} />
    <View style={styles.bgOrb2} />
    {[...Array(5)].map((_, i) => (
      <View key={i} style={[styles.gridLine, { top: (width * 0.4) * i }]} />
    ))}
  </>
);

export default function ManageEventScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { userInfo, logout } = useContext(AuthContext);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    if (userInfo?.token) {
      fetchEvents();
    } else {
      setLoading(false);
      setError('Please login to view events');
    }
  }, [userInfo]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userInfo?.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/merchant/events`, {
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const json = await response.json();

      // Handle different API response formats
      const eventData = json.data || json.events || json;
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Logout',
          onPress: () => logout(),
          style: 'destructive'
        }
      ]
    )
  }

  const renderEvent = ({ item }) => {
    const statusStr = String(item.status || '').toUpperCase();
    const statusColor = getStatusColor(statusStr);

    // Sales Progress Calculation
    const total = item.event_total_tickets || 0;
    const sold = item.tickets_sold || 0;
    const pct = total > 0 ? Math.round((sold / total) * 100) : 0;

    return (
      <TouchableOpacity
        style={[styles.eventCard, { borderColor: statusColor + '40' }]}
        activeOpacity={0.8}
        onPress={() => setSelectedEvent(item)}
      >
        <ImageBackground
          source={{ uri: getImageUrl(item.event_image) || 'https://via.placeholder.com/800x400' }}
          style={styles.cardHeaderImage}
          imageStyle={{ opacity: 0.6 }}
        >
          <LinearGradient
            colors={['rgba(5,10,20,0.2)', '#0B1623']}
            style={styles.cardInfoGradient}
          >
            {/* Top Floating Row */}
            <View style={styles.floatingTopRow}>
              <View style={styles.topRowLeft}>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '90', borderWidth: 1, borderColor: statusColor + '40' }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#FFF' }]} />
                  <Text style={[styles.statusText, { color: '#FFF' }]}>{statusStr}</Text>
                </View>
                {item.category && (
                  <View style={[styles.categoryBadge, { backgroundColor: 'rgba(19,32,53,0.8)', borderColor: statusColor + '30', borderWidth: 1 }]}>
                    <Text style={[styles.categoryText, { color: statusColor }]}>{item.category.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={[styles.accentTag, { backgroundColor: statusColor + '25', borderColor: statusColor + '40', borderWidth: 1 }]}>
                <Text style={[styles.accentTagText, { color: statusColor }]}>{pct}% SOLD</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Info Body */}
        <View style={styles.eventBody}>
          <View style={styles.bodyDetails}>
            <Text style={styles.cardTitle}>{item.event_name}</Text>
            <View style={styles.venueRow}>
              <Text style={styles.cardVenue}>{item.event_venue || 'No Venue Specified'}</Text>
              <View style={[styles.venueDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.cardSchedule, { color: statusColor }]}>
                {item.event_date} • {formatTime(item.event_time)}
              </Text>
            </View>
            {item.description && (
              <Text style={styles.descriptionText} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>

          {/* Mini progress */}
          <View style={styles.miniRow}>
            <View style={styles.miniTrack}>
              <View style={[
                styles.miniFill,
                {
                  width: `${pct}%`,
                  backgroundColor: statusColor,
                  minWidth: pct > 0 ? 8 : 0,
                }
              ]} />
            </View>
            <Text style={styles.miniCount}>{sold.toLocaleString()} / {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Footer line mapping to EventScreen but with View Details text */}
        <View style={[styles.cardFooter, { borderTopColor: '#132035' }]}>
          <Text style={[styles.cardFooterText, { color: statusColor }]}>
            VIEW DETAILS  ›
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const EventDetailView = ({ event, onBack }) => {
    const statusStr = String(event.status || '').toUpperCase();
    const statusColor = getStatusColor(statusStr);

    const total = event.event_total_tickets || 0;
    const sold = event.tickets_sold || 0;
    const pct = total > 0 ? Math.round((sold / total) * 100) : 0;

    return (
      <View style={styles.detailRoot}>
        {/* Detail Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Foundation name="arrow-left" size={24} color={statusColor} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerBranding}>
              <Text style={styles.headerMedia}>Manage</Text>
              <Text style={styles.headerTix}>E</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.profileBtn}>
            <View style={styles.profileAvatar} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
          {/* Hero Image */}
          <View style={styles.detailHero}>
            <ImageBackground
              source={{ uri: getImageUrl(event.event_image) }}
              style={styles.detailBanner}
              imageStyle={{ borderRadius: 24 }}>
              <LinearGradient colors={['transparent', 'rgba(5,10,20,0.95)']}
                style={styles.detailHeroOverlay}>
                <Text style={styles.detailTitle}>{event.event_name}</Text>
                <View style={styles.heroMetaRow}>
                  <View style={styles.heroMetaItem}>
                    <Foundation name="marker" size={14} color={statusColor} />
                    <Text style={styles.heroMetaText}>{event.event_venue || 'No Venue Specified'}</Text>
                  </View>
                  <View style={styles.heroMetaItem}>
                    <Foundation name="calendar" size={14} color={statusColor} />
                    <Text style={[styles.heroMetaText, { color: statusColor }]}>{event.event_date}</Text>
                  </View>
                  <View style={styles.heroMetaItem}>
                    <Foundation name="clock" size={14} color={statusColor} />
                    <Text style={[styles.heroMetaText, { color: statusColor }]}>{formatTime(event.event_time)}</Text>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Main Counter Card */}
          <View style={[styles.mainCard, { shadowColor: statusColor }]}>
            <View style={styles.mainHeader}>
              <View>
                <Text style={styles.mainLabel}>TOTAL TICKETS SOLD</Text>
                <Text style={styles.mainCount}>
                  {sold.toLocaleString()}
                  <Text style={styles.mainCapacity}> / {total.toLocaleString()}</Text>
                </Text>
              </View>
              <View style={[styles.pctBadge, { borderColor: statusColor + '40', backgroundColor: statusColor + '10' }]}>
                <Text style={[styles.pctBadgeText, { color: statusColor }]}>{pct}%</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: statusColor }]} />
              <View style={[styles.progressGlow, { backgroundColor: statusColor }]} />
            </View>

            <View style={styles.percentRow}>
              <Text style={styles.percentText}>{pct}% of Capacity Sold</Text>
              <Text style={styles.remainingText}>
                {(total - sold).toLocaleString()} Remaining
              </Text>
            </View>
          </View>

          {/* Category Pill Banner */}
          {event.category && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>CATEGORY PERFORMANCE</Text>
              <View style={[styles.categoryPillBanner, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
                <Foundation name="ticket" size={18} color={statusColor} />
                <Text style={[styles.categoryPillText, { color: statusColor }]}>{event.category.toUpperCase()}</Text>
              </View>
            </View>
          )}

          {/* Ticket Tiers Section */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TICKET TIERS</Text>
            </View>
            <View style={styles.tierCard}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierName}>REGULAR ENTRY</Text>
                <Text style={[styles.tierPrice, { color: statusColor }]}>₱1,500</Text>
              </View>
              <View style={styles.tierStats}>
                <View style={styles.tierStatItem}>
                  <Text style={styles.tierStatVal}>{sold.toLocaleString()}</Text>
                  <Text style={styles.tierStatLabel}>SOLD</Text>
                </View>
                <View style={[styles.tierDivider, { backgroundColor: statusColor + '20' }]} />
                <View style={styles.tierStatItem}>
                  <Text style={styles.tierStatVal}>{total.toLocaleString()}</Text>
                  <Text style={styles.tierStatLabel}>CAPACITY</Text>
                </View>
              </View>

              {/* Tier Progress Bar */}
              <View style={styles.tierProgressContainer}>
                <View style={[styles.tierProgressBar, { width: `${pct}%`, backgroundColor: statusColor }]} />
              </View>
              <Text style={[styles.tierPctText, { color: statusColor }]}>{pct}% Sold</Text>
            </View>
          </View>

          {/* Line-up Section */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>EVENT LINE-UP</Text>
            <View style={styles.lineupGrid}>
              {['Headliner Name', 'Supporting Artist', 'Guest Performer'].map((artist, idx) => (
                <View key={idx} style={styles.lineupItem}>
                  <View style={[styles.artistAvatar, { backgroundColor: statusColor + '20' }]}>
                    <Foundation name="torsos-all" size={24} color={statusColor} />
                  </View>
                  <Text style={styles.artistName}>{artist}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Seat Plan Section */}
          {event.seat_plan && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>SEAT PLAN</Text>
              <View style={styles.seatPlanContainer}>
                <Image source={{ uri: getImageUrl(event.seat_plan) }} style={styles.detailSeatPlanImage} resizeMode="contain" />
              </View>
            </View>
          )}

          {/* Description Section */}
          {event.description && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>EVENT DESCRIPTION</Text>
              <View style={styles.descCard}>
                <Text style={styles.detailDescText}>{event.description}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgDecor />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00C2FF" />
          <Text style={styles.loadingText}>FETCHING EVENTS...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgDecor />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchEvents}>
            <Text style={styles.retryText}>REFRESH</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <BgDecor />

      <SafeAreaView style={styles.safeArea}>
        {selectedEvent ? (
          <EventDetailView event={selectedEvent} onBack={() => setSelectedEvent(null)} />
        ) : (
          <View style={{ flex: 1 }}>
            {/* Header matches reference */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation?.toggleDrawer?.()} style={styles.menuBtn}>
                <View style={styles.menuLine} />
                <View style={[styles.menuLine, { width: 14 }]} />
                <View style={styles.menuLine} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerBranding}>
                  <Text style={styles.headerMedia}>Manage</Text>
                  <Text style={styles.headerTix}>Events</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.profileBtn}>
                <View style={styles.profileAvatar} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <FlatList
                data={events}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={[styles.centerContainer, { marginTop: 100 }]}>
                    <Text style={styles.noDataText}>NO EVENTS ON RECORD</Text>
                  </View>
                }
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050A14' },
  safeArea: { flex: 1 },

  // Background Decorations
  bgOrb1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: '#00C2FF', top: -150, left: -200, opacity: 0.03 },
  bgOrb2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#FF4D6A', bottom: -50, right: -150, opacity: 0.02 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerCenter: { alignItems: 'center' },
  headerBranding: { fontSize: 20 },
  headerMedia: { color: '#FFFFFF', fontWeight: '600' },
  headerTix: { color: '#00C2FF', fontWeight: '800' },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', gap: 4 },
  menuLine: { width: 18, height: 1.5, backgroundColor: '#4A8AAF', borderRadius: 1 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#132035', padding: 2 },
  profileAvatar: { flex: 1, borderRadius: 16, backgroundColor: '#00C2FF', opacity: 0.5 },

  // Page Heading
  pageHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, marginTop: 10 },
  pageHeadTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  pageHeadSub: { color: '#4A8AAF', fontSize: 13, fontWeight: '500' },
  pulseOrb: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00E5A0', shadowColor: '#00E5A0', shadowOpacity: 0.9, shadowRadius: 8, elevation: 6 },

  // List & Cards
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  eventCard: { backgroundColor: '#0B1623', borderRadius: 24, borderWidth: 1, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },

  // Card Header Image
  cardHeaderImage: { width: '100%', height: 140 },
  cardInfoGradient: { ...StyleSheet.absoluteFillObject, padding: 16, justifyContent: 'space-between' },
  floatingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  categoryText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  accentTag: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  accentTagText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  floatingSeatPlan: { position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: 10, borderWidth: 2, borderColor: '#0B1623', overflow: 'hidden', backgroundColor: '#132035' },
  seatPlanIndicatorImage: { width: '100%', height: '100%' },
  seatPlanIconOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  seatPlanIconMini: { fontSize: 12 },

  // Body
  eventBody: { padding: 16, paddingBottom: 10 },
  bodyDetails: { marginBottom: 14 },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  venueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardVenue: { color: '#4A8AAF', fontSize: 12, fontWeight: '600' },
  venueDot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 8, opacity: 0.5 },
  cardSchedule: { fontSize: 12, fontWeight: '700' },
  descriptionText: { color: '#3D6080', fontSize: 12, lineHeight: 18, marginTop: 4 },

  // Mini progress
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniTrack: { flex: 1, height: 6, backgroundColor: '#132035', borderRadius: 3, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 3 },
  miniCount: { color: '#2A4A60', fontSize: 11, fontWeight: '700' },

  cardFooter: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  cardFooterText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },

  // States
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 16, fontSize: 14, color: '#4A8AAF', fontWeight: '600', letterSpacing: 1 },
  errorText: { fontSize: 14, color: '#FF4D6A', textAlign: 'center', fontWeight: '600', marginBottom: 16 },
  noDataText: { fontSize: 14, color: '#3D6080', textAlign: 'center', fontWeight: '800', letterSpacing: 1.5 },
  retryBtn: { borderRadius: 20, borderWidth: 1, borderColor: '#132035', paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#0B1623' },
  retryText: { color: '#00C2FF', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  // Detail View Styles
  detailRoot: { flex: 1 },
  detailScroll: { paddingHorizontal: 20, paddingBottom: 40 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#132035' },

  detailHero: { height: 260, marginBottom: 20 },
  detailBanner: { width: '100%', height: '100%', justifyContent: 'flex-end', overflow: 'hidden' },
  detailHeroOverlay: { padding: 20, paddingTop: 60, borderRadius: 24, justifyContent: 'flex-end' },
  detailTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { color: '#4A8AAF', fontSize: 13, fontWeight: '600' },
  statusDotWhite: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  statusTextWhite: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

  mainCard: {
    backgroundColor: '#0B1623', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#132035', marginBottom: 16,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
  },
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  mainLabel: { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  mainCount: { color: '#FFFFFF', fontSize: 40, fontWeight: '800', marginTop: 4 },
  mainCapacity: { color: '#3D6080', fontSize: 20, fontWeight: '600' },

  pctBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  pctBadgeText: { fontSize: 18, fontWeight: '900' },

  progressContainer: { height: 12, backgroundColor: '#132035', borderRadius: 6, overflow: 'hidden', marginVertical: 12 },
  progressBar: { height: '100%', borderRadius: 6 },
  progressGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 },

  percentRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  percentText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  remainingText: { color: '#3D6080', fontSize: 12, fontWeight: '600' },

  eventMetaStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0B1623', borderRadius: 14, borderWidth: 1, borderColor: '#132035',
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24,
  },
  eventMetaVenue: { color: '#3D6080', fontSize: 12, fontWeight: '600' },
  eventMetaDate: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  detailSection: { marginBottom: 24 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 16, paddingLeft: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionBadge: { backgroundColor: '#00E5A020', color: '#00E5A0', fontSize: 9, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#00E5A040' },

  categoryPillBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  categoryPillText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  tierCard: { backgroundColor: '#0B1623', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#132035', marginBottom: 12 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tierName: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  tierPrice: { fontSize: 16, fontWeight: '900' },
  tierStats: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  tierStatItem: { flex: 1 },
  tierStatVal: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  tierStatLabel: { color: '#3D6080', fontSize: 10, fontWeight: '700', marginTop: 2 },
  tierDivider: { width: 1, height: 30 },

  tierProgressContainer: { height: 6, backgroundColor: '#132035', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  tierProgressBar: { height: '100%', borderRadius: 3 },
  tierPctText: { fontSize: 10, fontWeight: '800', textAlign: 'right', letterSpacing: 1 },

  lineupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  lineupItem: { width: (width - 64) / 3, alignItems: 'center' },
  artistAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  artistName: { color: '#FFF', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  seatPlanContainer: { height: 180, backgroundColor: '#0B1623', borderRadius: 24, borderWidth: 1, borderColor: '#132035', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', padding: 10 },
  detailSeatPlanImage: { width: '100%', height: '100%' },

  descCard: { backgroundColor: '#0B1623', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#132035' },
  detailDescText: { color: '#4A8AAF', fontSize: 14, lineHeight: 22 },

  viewOnlyFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 20, opacity: 0.6,
  },
  viewOnlyText: { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});
