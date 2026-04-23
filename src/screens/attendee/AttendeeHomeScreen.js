import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, ScrollView, Image, ImageBackground, Alert, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useState, useContext, useRef, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Foundation } from '@expo/vector-icons'
import { AuthContext } from '../../context/AuthContext'
import Header from '../../components/Header'
import { API_BASE_URL, IMAGE_BASE_URL } from '../../config';
import { startOfWeek, endOfWeek, format } from 'date-fns';

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

const getPerformerImageUrl = (path) => {
  if (!path || path === 'null') return null;
  if (path.startsWith('http')) return path;

  const baseUrl = IMAGE_BASE_URL.endsWith('/')
    ? IMAGE_BASE_URL.slice(0, -1)
    : IMAGE_BASE_URL;

  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/storage/${cleanPath}`;
};


const getTodayStr = () => format(new Date(), 'yyyy-MM-dd');

// Strip HTML tags and decode common entities
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const BgDecor = () => (
  <>
    <View style={styles.bgOrb1} />
    <View style={styles.bgOrb2} />
  </>
);

export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [pastEventsData, setPastEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { userInfo } = useContext(AuthContext);

  const [activeIndex, setActiveIndex] = useState(1);
  const [recentPageIndex, setRecentPageIndex] = useState(0);
  const scrollRef = useRef(null)

  const fetchEvents = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      if (!userInfo?.token) {
        throw new Error('Not authenticated');
      }

      const [response, pastResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/users/events`, {
          headers: {
            "Authorization": `Bearer ${userInfo.token}`,
            "Accept": "application/json"
          }
        }),
        fetch(`${API_BASE_URL}/users/past-events`, {
          headers: {
            "Authorization": `Bearer ${userInfo.token}`,
            "Accept": "application/json"
          }
        })
      ]);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      if (!pastResponse.ok) {
        throw new Error(`HTTP Error (Past Events): ${pastResponse.status}`);
      }

      const json = await response.json();
      const pastJson = await pastResponse.json();

      const eventData = json.data || json.events || json;
      setEvents(Array.isArray(eventData) ? eventData : []);

      const pastData = pastJson.data || pastJson.events || pastJson;
      setPastEventsData(Array.isArray(pastData) ? pastData : []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userInfo?.token) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [userInfo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(true);
  };

  const today = getTodayStr();

  // Calendar-based week: Monday–Sunday using date-fns
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // 1 = Monday
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const isActive = (e) =>
    e.status === 1 || e.status === '1' ||
    String(e.status).toUpperCase() === 'ACTIVE' ||
    String(e.status).toUpperCase() === 'LIVE' ||
    String(e.category).toUpperCase() === 'ONGOING';
  const isCompleted = (e) => e.status === 2 || e.status === '2' || String(e.status).toUpperCase() === 'COMPLETED';

  const activeEvents = events.filter(e => isActive(e) && !isCompleted(e));
  const upcomingEvents = events.filter(e => !isActive(e) && !isCompleted(e) && e.event_date && e.event_date >= today);

  const allFutureEvents = [...activeEvents, ...upcomingEvents];

  // Hero: Show Active first, then Upcoming
  const heroData = [...activeEvents, ...upcomingEvents].slice(0, 5);

  // Don't Miss: Events falling within the current calendar week (Mon–Sun)
  const missThisWeek = allFutureEvents
    .filter(e => (e.event_date || '') >= weekStartStr && (e.event_date || '') <= weekEndStr)
    .slice(0, 8);

  // Explore: Show only first 5
  const exploreEvents = allFutureEvents.slice(0, 5);

  // Recent: Past or Completed events
  const RECENT_PER_PAGE = 5;
  const recentPagesCount = Math.ceil(pastEventsData.length / RECENT_PER_PAGE);
  const recentEvents = pastEventsData.slice(
    recentPageIndex * RECENT_PER_PAGE,
    (recentPageIndex + 1) * RECENT_PER_PAGE
  );

  const clonedHeroEvents = heroData.length > 0
    ? [heroData[heroData.length - 1], ...heroData, heroData[0]]
    : [];

  // Auto-scroll logic
  useEffect(() => {
    if (clonedHeroEvents.length === 0) return;

    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;

      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });

      setTimeout(() => {
        if (nextIndex >= clonedHeroEvents.length - 1) {
          scrollRef.current?.scrollTo({ x: width, animated: false });
          setActiveIndex(1);
        } else {
          setActiveIndex(nextIndex);
        }
      }, 100); // 100ms
    }, 5000); // 5 secs

    return () => clearInterval(interval);
  }, [activeIndex, clonedHeroEvents.length]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);

    // Silent jumps for manual swipe
    if (index === 0) {
      // Swiped into the clone of the last item
      scrollRef.current?.scrollTo({ x: heroData.length * width, animated: false });
      setActiveIndex(heroData.length);
    } else if (index === clonedHeroEvents.length - 1) {
      // Swiped into the clone of the first item
      scrollRef.current?.scrollTo({ x: width, animated: false });
      setActiveIndex(1);
    } else {
      setActiveIndex(index);
    }
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgDecor />
        <SafeAreaView style={styles.safeArea}>
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00C2FF" />
            <Text style={styles.loadingText}>Finding best festivals...</Text>
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00C2FF"
            />
          }
        >

          {/* Hero Carousel */}
          {clonedHeroEvents.length > 0 ? (
            <View style={styles.heroContainer}>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                contentOffset={{ x: width, y: 0 }}
                style={styles.heroCarousel}
              >
                {clonedHeroEvents.map((event, idx) => (
                  <View key={`${event.id}-${idx}`} style={styles.heroCard}>
                    <ImageBackground
                      source={{ uri: event.event_image_url || getImageUrl(event.event_image) }}
                      style={styles.heroBg}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(5,10,20,0.9)']}
                        style={styles.heroOverlay}
                      >
                        <View style={styles.heroTag}>
                          <Text style={styles.heroTagText}>
                            {(event.category).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.heroTitle}>{event.event_name}</Text>
                        {/* <View style={styles.heroMetaRow}>
                          <View style={styles.heroMetaItem}>
                            <Foundation name="marker" size={13} color="#00C2FF" />
                            <Text style={[styles.heroMetaText, { color: '#FFF' }]}>{event.event_venue || 'TBA'}</Text>
                          </View>
                          <View style={styles.heroMetaDot} />
                          <View style={styles.heroMetaItem}>
                            <Foundation name="calendar" size={13} color="#00C2FF" />
                            <Text style={[styles.heroMetaText, { color: '#FFF' }]}>{event.event_date}</Text>
                          </View>
                        </View> */}
                        <Text style={styles.heroSubtitle} numberOfLines={2}>{stripHtml(event.description)}</Text>

                        <TouchableOpacity
                          style={styles.heroFab}
                          onPress={() => navigation.navigate('AttendeeEventDetails', { event })}
                        >
                          <Text style={styles.heroFabText}>View Tickets Now</Text>
                        </TouchableOpacity>
                      </LinearGradient>
                    </ImageBackground>
                  </View>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              <View style={styles.paginationDots}>
                {heroData.map((_, i) => {
                  const isDotActive = (activeIndex - 1 + heroData.length) % heroData.length === i;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        isDotActive && styles.dotActive
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          ) : !error && (
            <View style={styles.heroCard}>
              <LinearGradient
                colors={['#132035', '#050A14']}
                style={styles.emptyHeroGradient}
              >
                <View style={[styles.heroTag, { backgroundColor: 'rgba(0,194,255,0.1)' }]}>
                  <Text style={[styles.heroTagText, { color: '#00C2FF' }]}>WELCOME</Text>
                </View>
                <Text style={styles.heroTitle}>Discover Your Next Adventure</Text>
                <Text style={styles.heroSubtitle}>Stay tuned for the most exciting festivals and events in town.</Text>
              </LinearGradient>
            </View>
          )}

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>Unable to sync live events: {error}</Text>
              <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
                <Text style={styles.retryText}>RETRY</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Don't Miss This Week */}
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>Don't Miss This Week</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {missThisWeek.length > 0 ? (
                missThisWeek.map(item => (
                  <View key={item.id} style={styles.verticalCard}>
                    <View style={styles.vCardTop}>
                      <Image
                        source={{ uri: item.event_image_url || getImageUrl(item.event_image) }}
                        style={styles.vCardImg}
                      />
                      <View style={styles.vGenreTag}>
                        <Text style={styles.vGenreText}>
                          {(item.category || 'EVENT').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.vCardBottom}>
                      <View style={styles.vCardLeft}>
                        <Text style={styles.vCardTitle} numberOfLines={1}>{item.event_name}</Text>
                        <Text style={styles.vCardLoc}>{item.event_venue}</Text>
                        <Text style={styles.vCardDate}>{item.event_date} • {formatTime(item.event_time)}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.vCardBuyBtn}
                        onPress={() => navigation.navigate('AttendeeEventDetails', { event: item })}
                      >
                        <Text style={styles.vCardBuyText}>View Events</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : !loading && (
                <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
                  <Text style={styles.emptySectionText}>More events coming soon...</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Explore Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ExploreEvents')}>
                <Text style={styles.seeMoreBtn}>View More</Text>
              </TouchableOpacity>
            </View>
            {exploreEvents.length > 0 ? (
              exploreEvents.map(item => {
                const parts = (item.event_date || 'JAN 01').split('-');
                let month = 'JAN', day = '01';
                if (parts.length >= 3) {
                  // Fallback for YYYY-MM-DD
                  const d = new Date(item.event_date);
                  month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                  day = d.getDate().toString().padStart(2, '0');
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.listCard}
                    onPress={() => navigation.navigate('AttendeeEventDetails', { event: item })}
                  >
                    <View style={styles.listDateBox}>
                      <Text style={styles.listDateNum}>{day}</Text>
                      <Text style={styles.listDateMonth}>{month}</Text>
                    </View>
                    <View style={styles.listInfo}>
                      <Text style={styles.listTitle}>{item.event_name}</Text>
                      <Text style={styles.listDetails}>{item.event_venue} • {formatTime(item.event_time)}</Text>
                    </View>
                    <Text style={styles.listChevron}>›</Text>
                  </TouchableOpacity>
                );
              })
            ) : !loading && (
              <Text style={styles.emptySectionText}>Discover more events later</Text>
            )}
          </View>

          {/* Recent Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Events</Text>
              {recentPagesCount > 1 && (
                <View style={styles.miniPager}>
                  {Array.from({ length: recentPagesCount }).map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setRecentPageIndex(i)}
                      style={[
                        styles.miniDot,
                        i === recentPageIndex && styles.miniDotActive
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            {recentEvents.length > 0 ? (
              recentEvents.map(item => {
                const d = new Date(item.event_date);
                const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                const day = d.getDate().toString().padStart(2, '0');

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.listCard, styles.listCardPast]}
                    onPress={() => navigation.navigate('AttendeeEventDetails', { event: item })}
                  >
                    <View style={[styles.listDateBox, styles.listDateBoxPast]}>
                      <Text style={[styles.listDateNum, styles.listTextPast]}>{day}</Text>
                      <Text style={[styles.listDateMonth, styles.listTextPast]}>{month}</Text>
                    </View>
                    <View style={styles.listInfo}>
                      <Text style={[styles.listTitle, styles.listTextPast]}>{item.event_name}</Text>
                      <Text style={styles.listDetails}>{item.event_venue} • {formatTime(item.event_time)}</Text>
                    </View>
                    <Text style={styles.listChevron}>›</Text>
                  </TouchableOpacity>
                );
              })
            ) : !loading && (
              <Text style={styles.emptySectionText}>No past events to show</Text>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050A14' },

  bgOrb1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#00C2FF', top: -100, right: -100, opacity: 0.04,
  },
  bgOrb2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#00E5A0', bottom: 80, left: -80, opacity: 0.04,
  },

  safeArea: { flex: 1 },
  scrollContent: { paddingTop: 10 },

  centerContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  loadingText: {
    marginTop: 16, fontSize: 14, color: '#4A8AAF', fontWeight: '600', letterSpacing: 1,
  },

  // Hero Carousel
  heroContainer: { position: 'relative' },
  heroCarousel: { marginBottom: 32 },
  heroCard: { width: width, height: 500 },
  heroBg: { flex: 1 },
  paginationDots: {
    position: 'absolute',
    bottom: 50,
    right: 24,
    flexDirection: 'row',
    gap: 6
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFD700',
  },
  heroOverlay: { flex: 1, padding: 24, justifyContent: 'flex-end' },
  heroTag: {
    alignSelf: 'flex-start', backgroundColor: '#FFD700',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12
  },
  heroTagText: { color: '#050A14', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: 38, fontWeight: '900', letterSpacing: -1, marginBottom: 12, lineHeight: 40, width: '90%' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#4A8AAF' },
  heroMetaText: { color: '#C0D0E0', fontSize: 13, fontWeight: '600' },
  heroSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500', marginBottom: 24, width: '85%', lineHeight: 20 },
  heroFab: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16,
    shadowColor: '#FFF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
  },
  heroFabText: { color: '#000', fontWeight: '800', fontSize: 13 },

  emptyHeroGradient: {
    flex: 1, padding: 24, justifyContent: 'flex-end',
  },

  // Sections
  section: { marginBottom: 32, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 10 },
  seeMoreBtn: { color: '#00C2FF', fontSize: 13, fontWeight: '700' },
  emptySectionText: { color: '#3D6080', fontSize: 14, fontStyle: 'italic' },

  // Horizontal Cards (Don't Miss)
  verticalCard: {
    height: 280, width: 280, backgroundColor: '#0B1623', borderRadius: 24,
    marginRight: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#132035'
  },
  vCardTop: { height: '70%', position: 'relative' },
  vCardImg: { ...StyleSheet.absoluteFillObject },
  heartBtn: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.3)', width: 40, height: 40,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  heartIcon: { fontSize: 18 },
  vGenreTag: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(5,10,20,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  vGenreText: { color: '#00C2FF', fontSize: 10, fontWeight: '700' },
  vCardBottom: { height: '30%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  vCardLeft: { flex: 1 },
  vCardTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  vCardLoc: { color: '#4A8AAF', fontSize: 12, fontWeight: '600' },
  vCardDate: { color: '#3D6080', fontSize: 11, fontWeight: '500' },
  vCardBuyBtn: {
    backgroundColor: '#00C2FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    shadowColor: '#00C2FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  vCardBuyText: { color: '#000', fontWeight: '800', fontSize: 12 },

  // Error Banner
  errorBanner: {
    marginHorizontal: 20, padding: 16,
    backgroundColor: 'rgba(255, 77, 106, 0.1)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255, 77, 106, 0.2)',
    marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  errorText: { flex: 1, fontSize: 13, color: '#FF4D6A', fontWeight: '600' },
  retryBtn: {
    backgroundColor: '#FF4D6A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 12
  },
  retryText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  // List Cards
  listCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0B1623', borderRadius: 20,
    borderWidth: 1, borderColor: '#132035',
    padding: 16, marginBottom: 12,
  },
  listCardPast: { opacity: 0.75 },
  listDateBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(0,194,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  listDateBoxPast: { backgroundColor: '#132035' },
  listDateNum: { color: '#00C2FF', fontSize: 18, fontWeight: '800' },
  listDateMonth: { color: '#00C2FF', fontSize: 10, fontWeight: '700' },
  listTextPast: { color: '#8A9BAA' },
  listInfo: { flex: 1 },
  listTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  listDetails: { color: '#3D6080', fontSize: 12 },
  listChevron: { color: '#132035', fontSize: 24, marginLeft: 8 },

  // Standardized Empty State
  emptyWrap: {
    alignItems: 'start'
  },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  emptySub: { color: '#4A8AAF', fontSize: 12, lineHeight: 18 },

  // Pagination Styles
  miniPager: { flexDirection: 'row', gap: 4 },
  miniDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(74, 138, 175, 0.3)' },
  miniDotActive: { width: 12, backgroundColor: '#00C2FF' },

  pageControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  pageBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#0B1623', borderRadius: 8, borderWidth: 1, borderColor: '#132035' },
  pageBtnText: { color: '#00C2FF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  pageIndicator: { color: '#4A8AAF', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
});
