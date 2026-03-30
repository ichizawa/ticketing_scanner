import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  StyleSheet,
  Text,
  Alert,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
  Animated,
  ScrollView,
  Image,
  ImageBackground
} from 'react-native';
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

const BgDecor = () => (
  <>
    <View style={styles.bgOrb1} />
    <View style={styles.bgOrb2} />
  </>
);

export default function ManageEventScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { userInfo, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('All Events');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const TABS = ['All Events', 'Upcoming', 'Ongoing', 'Completed', 'Active', 'Cancelled'];

  const getFilteredEvents = () => {
    if (activeTab === 'All Events') return events;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return events.filter(event => {
      // Normalize status and date if needed
      const statusStr = String(event.status || '').toUpperCase();
      const eventDate = event.event_date; // Assuming YYYY-MM-DD

      switch (activeTab) {
        case 'Upcoming':
          return eventDate > todayStr;
        case 'Ongoing':
          return eventDate === todayStr;
        case 'Completed':
          return eventDate < todayStr;
        case 'Active':
          return event.status === 1 || statusStr === 'ACTIVE' || statusStr === 'LIVE';
        case 'Cancelled':
          return event.status === 0 || statusStr === 'CANCELLED';
        default:
          return true;
      }
    });
  };


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

  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  const renderTabs = () => (
    <View style={styles.tabsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabItem,
                isActive && styles.activeTabItem
              ]}
            >
              <Text style={[
                styles.tabTextUI,
                isActive && styles.activeTabTextUI
              ]}>
                {tab}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEvent = ({ item }) => {
    // Defaulting to cyan/green accents from the reference design
    const statusStr = String(item.status || '').toUpperCase();
    const isLive = item.status === 1 || statusStr === 'ACTIVE' || statusStr === 'LIVE' || statusStr === 'ON LIVE';

    const accentColor = isLive ? '#00E5A0' : '#00C2FF';
    const statusColor = getStatusColor(statusStr);

    // DB status is tinyint, so 1 is usually Active
    const statusLabel = isLive ? 'ACTIVE' : 'INACTIVE';

    const total = item.event_total_tickets || 0;
    const sold = item.tickets_sold || 0;
    const pct = total > 0 ? Math.round((sold / total) * 100) : 0;

    return (
      <TouchableOpacity
        style={[styles.eventCard, { borderColor: isLive ? accentColor + '55' : '#132035' }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EventDetails', { event: item })}
      >
        {/* Top row with status pill */}
        <View style={styles.cardTopRow}>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            {isLive && <View style={[styles.statusDot, { backgroundColor: statusColor }]} />}
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          <View style={[
            styles.accentTag,
            { backgroundColor: accentColor + '18', borderColor: accentColor + '33' }
          ]}>
            <Text style={[styles.accentTagText, { color: accentColor }]}>
              {pct}% SOLD
            </Text>
          </View>
        </View>

        {/* Info */}
        <Text style={styles.cardTitle}>{item.event_name}</Text>
        <Text style={styles.cardVenue}>{item.event_venue}</Text>
        <Text style={[styles.cardSchedule, { color: accentColor }]}>{item.event_date} • {formatTime(item.event_time)}</Text>

        <View style={styles.miniRow}>
          <View style={styles.miniTrack}>
            <View
              style={[
                styles.miniFill,
                { width: `${pct}%`, backgroundColor: accentColor }
              ]}
            />
          </View>
          <Text style={styles.miniCount}>
            {sold.toLocaleString()} / {total.toLocaleString()} SOLD
          </Text>
        </View>

        {/* Footer line mimicking reference */}
        <View style={[styles.cardFooter, { borderTopColor: isLive ? accentColor + '22' : '#0F1E30' }]}>
          <Text style={[styles.cardFooterText, { color: accentColor }]}>
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
              <Text style={styles.headerMedia}>MediaOne</Text>
              <Text style={styles.headerTix}>Tix</Text>
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
                  <Text style={styles.headerMedia}>MediaOne</Text>
                  <Text style={styles.headerTix}>Tix</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.profileBtn}>
                <View style={styles.profileAvatar} />
              </TouchableOpacity>
            </View>

            <View style={styles.pageHeadRow}>
              <View>
                <Text style={styles.pageHeadTitle}>Manage Events</Text>
                <Text style={styles.pageHeadSub}>Monitor your event performance and sales.</Text>
              </View>
            </View>

            {renderTabs()}

            <View style={{ flex: 1 }}>
              <FlatList
                data={getFilteredEvents()}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={[styles.centerContainer, { marginTop: 100 }]}>
                    <Text style={styles.noDataText}>NO {activeTab.toUpperCase()} EVENTS ON RECORD</Text>
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
  root: {
    flex: 1,
    backgroundColor: '#050A14'
  },
  safeArea: {
    flex: 1
  },
  bgOrb1: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: '#00C2FF', top: -100, right: -100, opacity: 0.04,
  },
  bgOrb2: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#FF5733', bottom: -50, left: -100, opacity: 0.03,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  headerCenter: { alignItems: 'center' },
  headerBranding: { fontSize: 20 },
  headerMedia: { color: '#FFFFFF', fontWeight: '600' },
  headerTix: { color: '#00C2FF', fontWeight: '800' },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', gap: 4 },
  menuLine: { width: 18, height: 1.5, backgroundColor: '#4A8AAF', borderRadius: 1 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#132035', padding: 2 },
  profileAvatar: { flex: 1, borderRadius: 16, backgroundColor: '#00C2FF', opacity: 0.5 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  eventCard: {
    backgroundColor: '#0B1623',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingBottom: 10
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3
  },
  statusText: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase'
  },
  cardTitle: {
    color: '#FFFFFF', fontSize: 17, fontWeight: '800', paddingHorizontal: 16,
    marginBottom: 4, letterSpacing: -0.3
  },
  cardVenue: {
    color: '#4A8AAF', fontSize: 12, fontWeight: '500', paddingHorizontal: 16,
    marginBottom: 3
  },
  cardSchedule: {
    fontSize: 12, fontWeight: '700', paddingHorizontal: 16, marginBottom: 14,
    letterSpacing: 0.3
  },
  cardFooter: {
    borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, marginTop: 4
  },
  cardFooterText: {
    fontSize: 12, fontWeight: '800', letterSpacing: 1.5
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#4A8AAF',
    fontWeight: '600',
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 14,
    color: '#FF4D6A',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 14,
    color: '#4A8AAF',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 1,
  },
  retryBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#132035',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#0B1623',
  },
  viewOnlyText: { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  pageHeadRow: {
    paddingHorizontal: 20, marginBottom: 10, marginTop: 5,
  },
  pageHeadTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  pageHeadSub: { color: '#4A5568', fontSize: 13, marginTop: 4 },
  accentTag: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  accentTagText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  miniRow: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 8 },
  miniTrack: { flex: 1, height: 4, backgroundColor: '#0F1E30', borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 2 },
  miniCount: { color: '#4A5568', fontSize: 11, fontWeight: '600' },
  tabsWrapper: {
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 10,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabItem: {
    // marginBottom: -10,
  },
  tabTextUI: {
    color: '#4A8AAF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeTabTextUI: {
    color: '#00C2FF',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    width: '100%',
    height: 3,
    backgroundColor: '#00C2FF',
    borderRadius: 2,
    shadowColor: '#00C2FF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
