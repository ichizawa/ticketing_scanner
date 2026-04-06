import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, ScrollView, Image, ImageBackground, Alert, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useState, useContext, useRef, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { AuthContext } from '../../context/AuthContext'
import Header from '../../components/Header'
import { API_BASE_URL, IMAGE_BASE_URL } from '../../config';

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


const REFINED_EXPLORE = [
  { id: 1, title: 'Tech Summit 2026', venue: 'Innovation Hub', time: '9:00 AM', date: 'MAR 22' },
  { id: 2, title: 'Electronic Paradise', venue: 'Downtown Arena', time: '8:00 PM', date: 'MAR 25' },
]

const RECENT_EVENTS = [
  { id: 1, title: 'Jazz & Blues Weekend', venue: 'Riverfront Stage', time: '6:00 PM', date: 'MAR 12' },
]

const BgDecor = () => (
  <>
    <View style={styles.bgOrb1} />
    <View style={styles.bgOrb2} />
  </>
);

export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { userInfo } = useContext(AuthContext);

  const [favorites, setFavorites] = useState([2])
  const [activeIndex, setActiveIndex] = useState(1);
  const scrollRef = useRef(null)

  const fetchEvents = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      if (!userInfo?.token) {
        console.log('No auth token found, fetch aborted');
        return;
      }

      // console.log('Fetching events from:', `${API_BASE_URL}/user/events`);

      const response = await fetch(`${API_BASE_URL}/users/events`, {
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Accept": "application/json"
        }
      });

      console.log('API Status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const json = await response.json();
      console.log('API Data received, events count:', (json.data || json.events || json).length);

      // Handle various response structures
      const eventData = json.data || json.events || json;
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const heroData = events.slice(0, 3);
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

      // Update state after animation would typically finish
      setTimeout(() => {
        if (nextIndex >= clonedHeroEvents.length - 1) {
          // If at the clone of the first item, jump back to the actual first item
          scrollRef.current?.scrollTo({ x: width, animated: false });
          setActiveIndex(1);
        } else {
          setActiveIndex(nextIndex);
        }
      }, 100); // 100ms transition time
    }, 5000); // 5 seconds interval

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
                    source={{ uri: event.event_image_url || getImageUrl(event.event_image) || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800' }}
                    style={styles.heroBg}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(5,10,20,0.9)']}
                      style={styles.heroOverlay}
                    >
                      <View style={styles.heroTag}>
                        <Text style={styles.heroTagText}>
                          {(event.category || event.event_category || 'EVENT').toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.heroTitle}>{event.event_name}</Text>
                      <Text style={styles.heroSubtitle}>{event.event_description}</Text>

                      <TouchableOpacity
                        style={styles.heroFab}
                        onPress={() => navigation.navigate('CustomerPurchase', { event })}
                      >
                        <Text style={styles.heroFabText}>Get Tickets Now</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              ))}
            </ScrollView>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Don't Miss This Week</Text>

            {/* Show next 3, or if very few, show all avoiding duplicates if needed */}
            {events.length > 0 ? (
              events.slice(3, 8).length > 0 ? (
                events.slice(3, 8).map(item => (
                  <View key={item.id} style={styles.verticalCard}>
                    <View style={styles.vCardTop}>
                      <Image
                        source={{ uri: item.event_image_url || getImageUrl(item.event_image) || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800' }}
                        style={styles.vCardImg}
                      />
                      <TouchableOpacity
                        style={styles.heartBtn}
                        onPress={() => toggleFavorite(item.id)}
                      >
                        <Text style={styles.heartIcon}>{favorites.includes(item.id) ? '❤️' : '🤍'}</Text>
                      </TouchableOpacity>
                      <View style={styles.vGenreTag}>
                        <Text style={styles.vGenreText}>
                          {(item.category || item.event_category || 'EVENT').toUpperCase()}
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
                        onPress={() => navigation.navigate('CustomerPurchase', { event: item })}
                      >
                        <Text style={styles.vCardBuyText}>Get Tickets</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySectionText}>More events coming soon...</Text>
              )
            ) : !loading && (
              <Text style={styles.emptySectionText}>No upcoming events found</Text>
            )}
          </View>

          {/* Explore Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore Events</Text>
              <TouchableOpacity><Text style={styles.seeMoreBtn}>View More</Text></TouchableOpacity>
            </View>
            {REFINED_EXPLORE.map(item => (
              <TouchableOpacity key={item.id} style={styles.listCard}>
                <View style={styles.listDateBox}>
                  <Text style={styles.listDateNum}>{item.date.split(' ')[1]}</Text>
                  <Text style={styles.listDateMonth}>{item.date.split(' ')[0]}</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listDetails}>{item.venue} • {item.time}</Text>
                </View>
                <Text style={styles.listChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Events */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Events</Text>
            {RECENT_EVENTS.map(item => (
              <TouchableOpacity key={item.id} style={[styles.listCard, styles.listCardPast]}>
                <View style={[styles.listDateBox, styles.listDateBoxPast]}>
                  <Text style={[styles.listDateNum, styles.listTextPast]}>{item.date.split(' ')[1]}</Text>
                  <Text style={[styles.listDateMonth, styles.listTextPast]}>{item.date.split(' ')[0]}</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={[styles.listTitle, styles.listTextPast]}>{item.title}</Text>
                  <Text style={styles.listDetails}>{item.venue} • {item.time}</Text>
                </View>
                <Text style={styles.listChevron}>›</Text>
              </TouchableOpacity>
            ))}
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
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: '#00C2FF', top: -100, right: -100, opacity: 0.04,
  },
  bgOrb2: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#FF5733', bottom: -50, left: -100, opacity: 0.03,
  },

  safeArea: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingBottom: 40 },

  centerContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  loadingText: {
    marginTop: 16, fontSize: 14, color: '#4A8AAF', fontWeight: '600', letterSpacing: 1,
  },

  // Hero Carousel
  heroCarousel: { marginBottom: 32 },
  heroCard: { width: width, height: 500 },
  heroBg: { flex: 1 },
  heroOverlay: { flex: 1, padding: 24, justifyContent: 'flex-end' },
  heroTag: {
    alignSelf: 'flex-start', backgroundColor: '#00C2FF',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12
  },
  heroTagText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: 38, fontWeight: '900', letterSpacing: -1, marginBottom: 8, lineHeight: 40, width: '75%' },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '500', marginBottom: 24, width: '70%', lineHeight: 22 },
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  seeMoreBtn: { color: '#00C2FF', fontSize: 13, fontWeight: '700' },
  emptySectionText: {
    color: '#3D6080', fontSize: 14, fontStyle: 'italic', marginTop: -10, marginBottom: 20
  },

  // Vertical Cards (Don't Miss)
  verticalCard: {
    height: 340, backgroundColor: '#0B1623', borderRadius: 24,
    marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#132035'
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
  listCardPast: { opacity: 0.4 },
  listDateBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(0,194,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  listDateBoxPast: { backgroundColor: '#132035' },
  listDateNum: { color: '#00C2FF', fontSize: 18, fontWeight: '800' },
  listDateMonth: { color: '#00C2FF', fontSize: 10, fontWeight: '700' },
  listTextPast: { color: '#555' },
  listInfo: { flex: 1 },
  listTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  listDetails: { color: '#3D6080', fontSize: 12 },
  listChevron: { color: '#132035', fontSize: 24, marginLeft: 8 },
});
