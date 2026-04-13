import { StyleSheet, Text, View, Dimensions, StatusBar, ScrollView, Animated, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import Header from '../../components/Header';
import { API_BASE_URL } from '../../config';
import { Foundation } from '@expo/vector-icons';

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

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/storage/${cleanPath}`;
};

const transformEvent = (apiEvent) => {
  const statusConfig = getStatusConfig(apiEvent.status);

  return {
    id: apiEvent.id?.toString() || Math.random().toString(),
    title: apiEvent.event_name,
    venue: apiEvent.event_venue,
    schedule: `${apiEvent.event_date} • ${formatTime(apiEvent.event_time)}`,
    date: apiEvent.event_date,
    time: formatTime(apiEvent.event_time),
    status: statusConfig.label,
    statusColor: statusConfig.color,
    statusCode: apiEvent.status,
    category: apiEvent.category,
    scanned: parseInt(apiEvent.scanned_tickets) || parseInt(apiEvent.scanned_count) || 0,
    totalTickets: parseInt(apiEvent.event_total_tickets) || 0,
    accentColor: '#00C2FF',
    imageUrl: apiEvent.event_image_url || getImageUrl(apiEvent.event_image) || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
  };
};

export default function EventScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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

  const fetchEvents = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      if (!userInfo?.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/staff/events`, {
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

      const formattedEvents = (Array.isArray(eventData) ? eventData : []).map(transformEvent);
      setEvents(formattedEvents);

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

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <SafeAreaView style={styles.safeArea}>
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00E5A0" />
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
        <SafeAreaView style={styles.safeArea}>
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.retryBtn}>
              <Text onPress={() => fetchEvents()} style={{ color: '#4A8AAF', fontSize: 12, fontWeight: '800' }}>RETRY</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      <SafeAreaView style={styles.safeArea}>
        <Header navigation={navigation} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00E5A0"
            />
          }
        >
          {/* Page Heading */}
          <View style={styles.pageHeadRow}>
            <View>
              <Text style={styles.pageHeadTitle}>YOUR EVENTS</Text>
              <Text style={styles.pageHeadSub}>Monitor live event scans</Text>
            </View>

            <Animated.View
              style={[styles.pulseOrb, { transform: [{ scale: pulseAnim }] }]}
            />
          </View>

          {/* Empty State */}
          {events.length === 0 && (
            <View style={[styles.centerContainer, { marginTop: 40 }]}>
              <Text style={styles.pageHeadSub}>No events assigned to you right now.</Text>
            </View>
          )}

          {events.map((ev) => {
            const pct = ev.totalTickets > 0 ? Math.round((ev.scanned / ev.totalTickets) * 100) : 0;

            return (
              <TouchableOpacity
                key={ev.id}
                style={styles.ticketCard}
                onPress={() => navigation.navigate('EventOrganizer', { event: ev })}
                activeOpacity={0.8}
              >
                {/* Main Event Area (Left) */}
                <View style={styles.ticketMain}>
                  <Image source={{ uri: ev.imageUrl }} style={styles.ticketThumb} />
                  <View style={styles.ticketHeaderInfo}>
                    <View style={styles.ticketTagsRow}>
                      <View style={[styles.statusBadgeMain, { backgroundColor: ev.statusColor + '15', borderColor: ev.statusColor + '30' }]}>
                        <Text style={[styles.statusBadgeText, { color: ev.statusColor }]}>{String(ev.status || '').toUpperCase()}</Text>
                      </View>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText} numberOfLines={1}>{String(ev.category).toUpperCase()}</Text>
                      </View>
                    </View>

                    <Text style={styles.ticketTitle} numberOfLines={2}>{String(ev.title).toUpperCase()}</Text>

                    <View style={styles.ticketMetaRow}>
                       <Foundation name="marker" size={11} color="#00C2FF" />
                       <Text style={[styles.ticketMetaText, { color: '#00C2FF' }]} numberOfLines={1}>{ev.venue}</Text>
                    </View>
                    
                    <View style={[styles.ticketMetaRow, { gap: 12 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Foundation name="calendar" size={11} color="#00C2FF" />
                        <Text style={styles.ticketMetaText} numberOfLines={1}>{ev.date}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Foundation name="clock" size={11} color="#00C2FF" />
                        <Text style={styles.ticketMetaText} numberOfLines={1}>{ev.time}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Vertical Cutout/Perforation */}
                <View style={styles.tearLineVertical}>
                  <View style={styles.tearCutTop} />
                  <View style={styles.tearDotsWrapVertical}>
                    {[...Array(6)].map((_, i) => <View key={i} style={styles.tearDotVertical} />)}
                  </View>
                  <View style={styles.tearCutBottom} />
                </View>

                {/* Stub Area (Right) */}
                <View style={styles.ticketStub}>
                  <Text style={[styles.stubValue, { color: ev.statusColor }]}>{ev.scanned.toLocaleString()}</Text>
                  <Text style={styles.stubLabel}>SCANNED</Text>

                  <View style={styles.stubProgressTrack}>
                    <View style={[styles.stubProgressFill, { width: `${pct}%`, backgroundColor: ev.statusColor }]} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

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

  pageHeadRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  pageHeadTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  pageHeadSub: { color: '#4A8AAF', fontSize: 13, fontWeight: '500' },

  pulseOrb: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#00E5A0',
    shadowColor: '#00E5A0', shadowOpacity: 0.9, shadowRadius: 8, elevation: 6
  },

  ticketCard: {
    flexDirection: 'row', backgroundColor: '#0B1623', borderRadius: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#132035', overflow: 'hidden'
  },
  ticketMain: { flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  ticketThumb: { width: 68, height: 68, borderRadius: 12, marginRight: 12, backgroundColor: '#132035' },
  ticketHeaderInfo: { flex: 1, paddingRight: 4 },

  ticketTagsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  statusBadgeMain: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 229, 160, 0.1)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0, 229, 160, 0.2)' },
  categoryBadge: { flexShrink: 1, backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)' },
  categoryText: { color: '#FFD700', fontSize: 8, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  ticketTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 8, letterSpacing: 0 },
  ticketMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  ticketMetaText: { color: '#7E97B3', fontSize: 10, fontWeight: '600' },

  tearLineVertical: { width: 20, alignItems: 'center', position: 'relative' },
  tearCutTop: { position: 'absolute', top: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#050A14', borderWidth: 1, borderColor: '#132035', zIndex: 2 },
  tearCutBottom: { position: 'absolute', bottom: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#050A14', borderWidth: 1, borderColor: '#132035', zIndex: 2 },
  tearDotsWrapVertical: { flex: 1, justifyContent: 'space-between', paddingVertical: 18 },
  tearDotVertical: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#0F1E30' },

  ticketStub: { width: 100, padding: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A121D' },
  statusBadgeText: { color: '#00E5A0', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  stubValue: { color: '#00C2FF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  stubLabel: { color: '#2E4A62', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },

  stubProgressTrack: { height: 4, backgroundColor: '#132035', borderRadius: 2, overflow: 'hidden', width: '100%', marginTop: 12 },
  stubProgressFill: { height: '100%', borderRadius: 2 },

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
  retryBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#132035',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#0B1623',
  },
});