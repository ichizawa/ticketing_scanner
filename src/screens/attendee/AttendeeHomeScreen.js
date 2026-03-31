import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, ScrollView, Image, ImageBackground, Alert
} from 'react-native'
import React, { useState, useContext, useRef, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { AuthContext } from '../../context/AuthContext'
import Header from '../../components/Header'

const { width } = Dimensions.get('window')

// Mock Data
const HERO_EVENTS = [
  { id: 1, title: 'ELECTRONIC PARADISE', genre: 'ELECTRONIC', desc: 'The ultimate beach festival experience with top DJs.', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
  { id: 2, title: 'ART EXPO 2026', genre: 'ART & CULTURE', desc: 'Modern masterpieces from around the globe.', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800' },
  { id: 3, title: 'TECH SUMMIT', genre: 'INNOVATION', desc: 'Building the future together with industry leaders.', image: 'https://images.unsplash.com/photo-1540575861501-7c03b177a2a5?auto=format&fit=crop&q=80&w=800' },
]

// For seamless loop: [Last, 0, 1, 2, First]
const CLONED_EVENTS = [
  HERO_EVENTS[HERO_EVENTS.length - 1],
  ...HERO_EVENTS,
  HERO_EVENTS[0],
]

const DON_MISS = [
  { id: 1, title: 'Summer Fest 2025', genre: 'Festival', venue: 'Grand Plaza Arena', time: 'Mar 18, 7:00 PM', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=600', isFavorite: false },
  { id: 2, title: 'Indie Dreams', genre: 'Live Music', venue: 'The Underground', time: 'Mar 20, 8:30 PM', image: 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&q=80&w=600', isFavorite: true },
]

const REFINED_EXPLORE = [
  { id: 1, title: 'Tech Summit 2026', venue: 'Innovation Hub', time: '9:00 AM', date: 'MAR 22' },
  { id: 2, title: 'Electronic Paradise', venue: 'Downtown Arena', time: '8:00 PM', date: 'MAR 25' },
]

const RECENT_EVENTS = [
  { id: 1, title: 'Jazz & Blues Weekend', venue: 'Riverfront Stage', time: '6:00 PM', date: 'MAR 12' },
]

export default function HomeScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([2])
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef(null)

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;

      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });

      // Update state after animation would typically finish
      setTimeout(() => {
        if (nextIndex >= CLONED_EVENTS.length - 1) {
          // If at the clone of the first item, jump back to the actual first item
          scrollRef.current?.scrollTo({ x: width, animated: false });
          setActiveIndex(1);
        } else {
          setActiveIndex(nextIndex);
        }
      }, 100); // 100ms transition time
    }, 3000); // 3 seconds interval

    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);

    // Silent jumps for manual swipe
    if (index === 0) {
      // Swiped into the clone of the last item
      scrollRef.current?.scrollTo({ x: HERO_EVENTS.length * width, animated: false });
      setActiveIndex(HERO_EVENTS.length);
    } else if (index === CLONED_EVENTS.length - 1) {
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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <SafeAreaView style={styles.safeArea}>
        <Header navigation={navigation} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Hero Carousel */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            contentOffset={{ x: width, y: 0 }} // Start at first real item
            style={styles.heroCarousel}
          >
            {CLONED_EVENTS.map((event, idx) => (
              <View key={`${event.id}-${idx}`} style={styles.heroCard}>
                <ImageBackground source={{ uri: event.image }} style={styles.heroBg}>
                  <LinearGradient
                    colors={['transparent', 'rgba(5,10,20,0.9)']}
                    style={styles.heroOverlay}
                  >
                    <View style={styles.heroTag}><Text style={styles.heroTagText}>{event.genre}</Text></View>
                    <Text style={styles.heroTitle}>{event.title}</Text>
                    <Text style={styles.heroSubtitle}>{event.desc}</Text>

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

          {/* Don't Miss This Week - Vertical List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Don't Miss This Week</Text>
            {DON_MISS.map(item => (
              <View key={item.id} style={styles.verticalCard}>
                <View style={styles.vCardTop}>
                  <Image source={{ uri: item.image }} style={styles.vCardImg} />
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggleFavorite(item.id)}
                  >
                    <Text style={styles.heartIcon}>{favorites.includes(item.id) ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                  <View style={styles.vGenreTag}><Text style={styles.vGenreText}>{item.genre}</Text></View>
                </View>
                <View style={styles.vCardBottom}>
                  <View style={styles.vCardLeft}>
                    <Text style={styles.vCardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.vCardLoc}>{item.venue}</Text>
                    <Text style={styles.vCardDate}>{item.time}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.vCardBuyBtn}
                    onPress={() => navigation.navigate('CustomerPurchase', { event: item })}
                  >
                    <Text style={styles.vCardBuyText}>Get Tickets</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
  )
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

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 20 },
  headerMedia: { color: '#FFFFFF', fontWeight: '600' },
  headerTix: { color: '#00C2FF', fontWeight: '800' },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', gap: 4 },
  menuLine: { width: 18, height: 1.5, backgroundColor: '#4A8AAF', borderRadius: 1 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#132035', padding: 2 },
  profileAvatar: { flex: 1, borderRadius: 16, backgroundColor: '#00C2FF', opacity: 0.5 },

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
    // position: 'absolute', bottom: 1, right: 257,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16,
    shadowColor: '#FFF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
  },
  heroFabText: { color: '#000', fontWeight: '800', fontSize: 13, },
  // Sections
  section: { marginBottom: 32, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 20 },
  seeMoreBtn: { color: '#00C2FF', fontSize: 13, fontWeight: '700', marginBottom: 20 },

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
})
