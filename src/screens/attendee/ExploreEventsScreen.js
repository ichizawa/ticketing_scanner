import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  StatusBar, FlatList, Image, TextInput, ActivityIndicator,
  RefreshControl, ScrollView
} from 'react-native';
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL, IMAGE_BASE_URL } from '../../config';
import Header from '../../components/Header';
import { format } from 'date-fns';

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
  const baseUrl = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/storage/${cleanPath}`;
};

const getPerformersList = (performers) => {
  if (!performers) return null;
  try {
    const data = typeof performers === 'string' ? JSON.parse(performers) : performers;
    if (!Array.isArray(data) || data.length === 0) return null;
    return data.map(p => p.name).join(', ');
  } catch (e) {
    return null;
  }
};

const getTodayStr = () => format(new Date(), 'yyyy-MM-dd');

const isActive = (e) =>
  e.status === 1 || e.status === '1' ||
  String(e.status).toUpperCase() === 'ACTIVE' ||
  String(e.status).toUpperCase() === 'LIVE' ||
  String(e.category).toUpperCase() === 'ONGOING';

const isCompleted = (e) =>
  e.status === 2 || e.status === '2' ||
  String(e.status).toUpperCase() === 'COMPLETED';

export default function ExploreEventsScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tabScrollIndex, setTabScrollIndex] = useState(0);
  const tabScrollRef = React.useRef(null);
  const [isTabScrollable, setIsTabScrollable] = useState(false);

  const fetchEvents = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      if (!userInfo?.token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE_URL}/users/events`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const json = await response.json();
      const eventData = json.data || json.events || json;
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(true);
  };

  const today = getTodayStr();

  const futureEvents = useMemo(
    () =>
      events.filter(
        (e) => !isCompleted(e) && (isActive(e) || (e.event_date || '') >= today)
      ),
    [events, today]
  );

  // Build category list dynamically from the fetched events
  const categories = useMemo(() => {
    const seen = new Set();
    futureEvents.forEach((e) => {
      const cat = (e.category || '').trim();
      if (cat) seen.add(cat);
    });
    return ['All', ...Array.from(seen).sort()];
  }, [futureEvents]);

  const TAB_DOTS = Math.ceil(categories.length / 2);

  const filtered = useMemo(() => {
    let list = futureEvents;
    if (selectedCategory !== 'All') {
      list = list.filter(
        (e) => (e.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          (e.event_name || '').toLowerCase().includes(q) ||
          (e.event_venue || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [futureEvents, selectedCategory, search]);

  const CARD_WIDTH = (width - 20 * 2 - 12) / 2;

  const renderItem = ({ item }) => {
    const imgUrl = item.event_image_url || getImageUrl(item.event_image);
    const live = String(item.category).toLowerCase() === 'ongoing';

    return (
      <TouchableOpacity
        style={[styles.card, { width: CARD_WIDTH }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AttendeeEventDetails', { event: item })}
      >
        {/* Image */}
        <View style={styles.cardImageWrap}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Ionicons name="image-outline" size={28} color="#1E3A50" />
            </View>
          )}
          {live && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
          )}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>
              {(item.category || 'EVENT').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.event_name}</Text>
          
          {getPerformersList(item.performers) && (
            <Text style={styles.cardPerformers} numberOfLines={1}>
              {getPerformersList(item.performers)}
            </Text>
          )}
          
          <View style={styles.cardInfoRow}>
            <View style={styles.cardMetaItem}>
              <Ionicons name="calendar-outline" size={10} color="#00C2FF" />
              <Text style={styles.cardMetaTextSmall}>{item.event_date}</Text>
            </View>
            <View style={styles.cardMetaItem}>
              <Ionicons name="location-outline" size={10} color="#4A8AAF" />
              <Text style={styles.cardMetaTextSmall} numberOfLines={1}>
                {item.event_venue || 'TBA'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      {/* Background orbs */}
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <SafeAreaView style={styles.safeArea}>
        <Header
          navigation={navigation}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.pageTitles}>
          <Text style={styles.mainTitle}>Explore Events</Text>
          <Text style={styles.subTitle}>{filtered.length} events found</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#4A8AAF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, venues..."
            placeholderTextColor="#3D6080"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#4A8AAF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Tabs */}
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
            onContentSizeChange={(w) => {
              if (w > width) setIsTabScrollable(true);
              else setIsTabScrollable(false);
            }}
          >
            {categories.map((cat) => {
              const isTab = cat === selectedCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tabItem, isTab && styles.activeTabItem]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.tabTextUI, isTab && styles.activeTabTextUI]}>
                    {cat}
                  </Text>
                  {isTab && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Pagination dots */}
          {isTabScrollable && (
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
          )}
        </View>

        {/* Events List */}
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#00C2FF" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={48} color="#1E3A50" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            key="two-col"
            data={filtered}
            keyExtractor={(item, idx) => `${item.id}-${idx}`}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
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
              <View style={styles.emptyWrap}>
                <Ionicons name="calendar-outline" size={56} color="#1E3A50" />
                <Text style={styles.emptyTitle}>No Events Found</Text>
                <Text style={styles.emptySub}>
                  {search || selectedCategory !== 'All'
                    ? 'Try adjusting your search or filter.'
                    : 'Check back soon for upcoming events.'}
                </Text>
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
  bgOrb1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#00C2FF', top: -80, right: -80, opacity: 0.05,
  },
  bgOrb2: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#00E5A0', bottom: 100, left: -70, opacity: 0.04,
  },
  safeArea: { flex: 1 },

  pageTitles: { paddingHorizontal: 20, marginTop: 8, marginBottom: 16 },
  mainTitle: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  subTitle: { color: '#4A5568', fontSize: 13, marginTop: 4 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0B1623', borderRadius: 14,
    borderWidth: 1, borderColor: '#132035',
    marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1, color: '#FFF', fontSize: 14, fontWeight: '500',
  },

  // Category tabs
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

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  columnWrapper: { gap: 12, marginBottom: 12 },

  // Event Card — portrait tile for 2-col grid
  card: {
    backgroundColor: '#0B1623', borderRadius: 18,
    borderWidth: 1, borderColor: '#132035',
    overflow: 'hidden',
  },
  cardImageWrap: { position: 'relative', height: 130 },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: {
    backgroundColor: '#0B1623', alignItems: 'center', justifyContent: 'center',
  },
  livePill: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,65,65,0.9)', paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 20,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFF' },
  livePillText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  categoryPill: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: '#FFD700', paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 6,
  },
  categoryPillText: { color: '#000', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  cardBody: { padding: 10 },
  cardTitle: { color: '#FFF', fontSize: 13, fontWeight: '700', marginBottom: 6, lineHeight: 18 },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  cardMetaTextSmall: { color: '#3D6080', fontSize: 9, fontWeight: '600', flex: 1 },
  cardPerformers: { color: '#00C2FF', fontSize: 9, fontWeight: '700', marginBottom: 2 },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { color: '#4A8AAF', marginTop: 12, fontSize: 13, fontWeight: '600' },
  errorText: { color: '#FF4D6A', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  retryBtn: {
    marginTop: 16, backgroundColor: '#FF4D6A',
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10,
  },
  retryText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 16 },
  emptySub: { color: '#3D6080', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
