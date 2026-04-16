import React, { useEffect, useState, useContext, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar, Animated, ScrollView, Image, ImageBackground, RefreshControl, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Foundation } from '@expo/vector-icons';
import { API_BASE_URL, IMAGE_BASE_URL } from '../../config';
import { AuthContext } from '../../context/AuthContext';

import Header from '../../components/Header';

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

const getImageUrl = (path) => {
  if (!path || path === 'null') return null;
  if (path.startsWith('http')) return path;

  const baseUrl = IMAGE_BASE_URL.endsWith('/')
    ? IMAGE_BASE_URL.slice(0, -1)
    : IMAGE_BASE_URL;

  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/storage/${cleanPath}`;
};


const getStatusConfig = (status) => {
  const s = String(status || '').toUpperCase();
  if (s.includes('UPCOMING')) return { label: 'UPCOMING', color: '#FFAA00' };
  if (s.includes('ONGOING') || s.includes('LIVE')) return { label: 'ONGOING', color: '#FF4D6A' };
  if (s.includes('ACTIVE')) return { label: 'ACTIVE', color: '#00E5A0' };
  if (s.includes('COMPLETED') || s.includes('PAST')) return { label: 'COMPLETED', color: '#FFFFFF' };
  if (s.includes('CANCELLED')) return { label: 'CANCELLED', color: '#FF5733' };

  const code = parseInt(status);
  switch (code) {
    case 0: return { label: 'UPCOMING', color: '#FFAA00' };
    case 1: return { label: 'ACTIVE', color: '#00E5A0' };
    case 2: return { label: 'ONGOING', color: '#FF4D6A' };
    case 3: return { label: 'COMPLETED', color: '#FFFFFF' };
    default: return { label: s || 'ACTIVE', color: '#00E5A0' };
  }
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { userInfo, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('All Events');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tabScrollRef = useRef(null);
  const [tabScrollIndex, setTabScrollIndex] = useState(0);

  const TABS = ['All Events', 'Upcoming', 'Ongoing', 'Completed', 'Active', 'Cancelled'];
  // Show 3 tabs at a time roughly — dots represent groups of tabs
  const TAB_DOTS = Math.ceil(TABS.length / 2);

  const getFilteredEvents = () => {
    let filtered = events;

    if (activeTab !== 'All Events') {
      filtered = events.filter(event => {
        const statusStr = String(event.status || '').toUpperCase();
        switch (activeTab) {
          case 'Upcoming':
            return event.status === 0 || statusStr === 'UPCOMING';
          case 'Ongoing':
            return event.status === 2 || statusStr === 'ONGOING';
          case 'Completed':
            return event.status === 3 || statusStr === 'COMPLETED' || statusStr === 'PAST';
          case 'Active':
            return event.status === 1 || statusStr === 'ACTIVE' || statusStr === 'LIVE';
          case 'Cancelled':
            return statusStr === 'CANCELLED';
          default:
            return true;
        }
      });
    }

    // Sort logic
    return [...filtered].sort((a, b) => {
      const statusA = String(a.status || '').toUpperCase();
      const statusB = String(b.status || '').toUpperCase();

      const isCompA = a.status === 3 || statusA === 'COMPLETED' || statusA === 'PAST';
      const isCompB = b.status === 3 || statusB === 'COMPLETED' || statusB === 'PAST';

      // Completed always last
      if (isCompA && !isCompB) return 1;
      if (!isCompA && isCompB) return -1;

      // Parse dates for hierarchical sorting
      const dA = new Date(`${a.event_date} ${a.event_time || '00:00'}`).getTime();
      const dB = new Date(`${b.event_date} ${b.event_time || '00:00'}`).getTime();

      if (!isNaN(dA) && !isNaN(dB)) {
        if (isCompA) {
          // Both are completed: most recent past first
          return dB - dA;
        }
        // Both are active/upcoming: soonest first
        return dA - dB;
      }
      return 0;
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

  const fetchEvents = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
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

      const eventData = json.data || json.events || json;
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(true);
  };

  const renderTabs = () => (
    <View style={styles.tabsWrapper}>
      <ScrollView
        ref={tabScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const contentW = e.nativeEvent.contentSize.width;
          const visibleW = e.nativeEvent.layoutMeasurement.width;
          const maxScroll = contentW - visibleW;
          const dotIndex = maxScroll > 0
            ? Math.round((x / maxScroll) * (TAB_DOTS - 1))
            : 0;
          setTabScrollIndex(dotIndex);
        }}
        scrollEventThrottle={16}
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

      {/* Pagination dots */}
      <View style={styles.tabDots}>
        {Array.from({ length: TAB_DOTS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.tabDot,
              i === tabScrollIndex && styles.tabDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );

  const EventCard = ({ item, navigation }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusStr = String(item.status || '').toUpperCase();
    const isLive = item.status === 1 || statusStr === 'ACTIVE' || statusStr === 'LIVE' || statusStr === 'ON LIVE';
    const statusConfig = getStatusConfig(item.status);
    const isCompleted = statusConfig.label === 'COMPLETED';
    const accentColor = isLive ? '#00E5A0' : isCompleted ? '#A0AEC0' : '#00C2FF';

    const total = item.event_total_tickets || 0;
    const sold = item.tickets_sold || 0;
    const pct = total > 0 ? Math.round((sold / total) * 100) : 0;

    return (
      <TouchableOpacity
        style={[
          styles.eventCard,
          {
            borderColor: isLive ? accentColor + '55' : (isCompleted ? '#2D3748' : '#132035'),
            backgroundColor: isCompleted ? '#1A202C' : '#0B1623'
          }
        ]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EventDetails', { event: item })}
      >
        <ImageBackground
          source={{ uri: item.event_image_url || getImageUrl(item.event_image) }}
          style={styles.cardBanner}
          resizeMode="cover"
          imageStyle={isCompleted ? { opacity: 0.7 } : {}}
        >
          <LinearGradient
            colors={['rgba(5,10,20,0.2)', 'rgba(5,10,20,0.85)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardTopRow}>
              {(item.category) && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    {(item.category).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={[
                styles.accentTag,
                { backgroundColor: 'rgba(5,10,20,0.6)', borderColor: accentColor + '40' }
              ]}>
                <Text style={[styles.accentTagText, { color: accentColor }]}>
                  {pct}% SOLD
                </Text>
              </View>
            </View>

            <View style={[styles.statusPill, { backgroundColor: statusConfig.color + '15', borderColor: statusConfig.color + '30', borderWidth: 1 }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, isCompleted && { color: '#E2E8F0' }]}>{item.event_name}</Text>
          <View style={styles.cardMetaRow}>
            <View style={styles.cardMetaItem}>
              <Foundation name="marker" size={11} color={accentColor} />
              <Text style={[styles.cardMetaText, isCompleted && { color: '#CBD5E0' }]} numberOfLines={1}>{item.event_venue || 'TBA'}</Text>
            </View>
            <View style={styles.cardMetaItem}>
              <Foundation name="calendar" size={11} color={accentColor} />
              <Text style={[styles.cardMetaText, isCompleted && { color: '#CBD5E0' }]}>{item.event_date}</Text>
            </View>
            <View style={styles.cardMetaItem}>
              <Foundation name="clock" size={11} color={accentColor} />
              <Text style={[styles.cardMetaText, isCompleted && { color: '#CBD5E0' }]}>{formatTime(item.event_time)}</Text>
            </View>
          </View>

          {/* About Event - Expandable Description */}
          {item.description && (
            <View style={styles.cardAbout}>
              <Text
                style={styles.cardAboutText}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {item.description}
              </Text>
              {item.description.length > 100 && (
                <TouchableOpacity
                  onPress={() => setIsExpanded(!isExpanded)}
                  style={styles.cardReadMore}
                >
                  <Text style={[styles.cardReadMoreText, isCompleted && { color: accentColor }]}>
                    {isExpanded ? 'View Less' : 'View More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={[styles.cardFooter, { borderTopColor: isCompleted ? '#2D3748' : '#0F1E30' }]}>
          <Text style={[styles.cardFooterText, isCompleted && { color: accentColor }]}>
            VIEW DETAILS ›
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEvent = ({ item }) => <EventCard item={item} navigation={navigation} />;


  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgDecor />
        <SafeAreaView style={styles.safeArea}>
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00C2FF" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgDecor />
        <SafeAreaView style={styles.safeArea}>
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchEvents()}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <BgDecor />

      <SafeAreaView style={styles.safeArea}>
        <Header navigation={navigation} />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.pageHeadTitle}>Manage Events</Text>
            <Text style={styles.pageHeadSub}>Monitor your event performance</Text>
          </View>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.refreshText}>Sync Data</Text>
          </TouchableOpacity>
        </View>

        {renderTabs()}

        <FlatList
          data={getFilteredEvents()}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.centerContainer, { marginTop: 60 }]}>
              <Text style={styles.noDataText}>
                {events.length === 0
                  ? 'No events found'
                  : `NO ${activeTab.toUpperCase()} EVENTS`}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00C2FF"
            />
          }
        />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10
  },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  refreshText: { color: '#00C2FF', fontSize: 13, fontWeight: '600' },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
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
  cardBanner: {
    height: 100, width: '100%', justifyContent: 'flex-end',
  },
  cardGradient: {
    padding: 16, width: '100%', flex: 1, justifyContent: 'space-between'
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start'
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3
  },
  statusText: {
    fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase'
  },
  categoryPill: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0
  },
  categoryPillText: {
    color: '#050A14',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  cardTitle: {
    color: '#FFFFFF', fontSize: 17, fontWeight: '800', paddingHorizontal: 16,
    marginBottom: 6, letterSpacing: -0.3, marginTop: 12
  },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 12, flexWrap: 'wrap' },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  cardAbout: { paddingHorizontal: 16, marginBottom: 12 },
  cardAboutText: { color: '#A0AEC0', fontSize: 11, lineHeight: 16, fontWeight: '500' },
  cardReadMore: { marginTop: 4 },
  cardReadMoreText: { color: '#00C2FF', fontSize: 11, fontWeight: '700' },
  cardFooter: {
    borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, marginTop: 4,
    alignItems: 'flex-end'
  },
  cardFooterText: {
    fontSize: 12, fontWeight: '800', color: '#00C2FF', letterSpacing: 1.5, textAlign: 'right'
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
  activeTabItem: {},
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
  tabDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 5,
  },
  tabDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(74, 138, 175, 0.3)',
  },
  tabDotActive: {
    width: 16,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00C2FF',
    shadowColor: '#00C2FF',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
});
