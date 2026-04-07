import { StyleSheet, Text, View, Dimensions, StatusBar, ScrollView, Animated, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import Header from '../../components/Header';
import { API_BASE_URL } from '../../config';

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

const transformEvent = (apiEvent) => {
  const statusConfig = getStatusConfig(apiEvent.status);
  const statusStr = String(apiEvent.status || '').toUpperCase();

  return {
    id: apiEvent.id?.toString() || Math.random().toString(),
    title: apiEvent.event_name || 'Unnamed Event',
    venue: apiEvent.event_venue || 'TBA',
    schedule: `${apiEvent.event_date || 'TBA'} • ${formatTime(apiEvent.event_time)}`,
    status: statusConfig.label,
    statusColor: statusConfig.color,
    statusCode: apiEvent.status,
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
                style={[
                  styles.eventCard,
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('EventOrganizer', { event: ev })}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.statusPill, { backgroundColor: ev.statusColor + '18' }]}>
                    <Text style={[styles.statusText, { color: ev.statusColor }]}>{ev.status}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{ev.title}</Text>
                <Text style={styles.cardVenue}>{ev.venue}</Text>
                <Text style={[styles.cardSchedule]}>{ev.schedule}</Text>
                <View style={styles.miniRow}>
                  <View style={styles.miniTrack}>
                    <View
                      style={[
                        styles.miniFill,
                        { width: `${pct}%`, backgroundColor: ev.accentColor }
                      ]}
                    />
                  </View>
                </View>
                <View style={{ height: 16 }} /> 
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

  eventCard: {
    backgroundColor: '#0B1623', borderRadius: 20, borderWidth: 1,
    marginBottom: 16, overflow: 'hidden', shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25,
    shadowRadius: 16, elevation: 10,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingBottom: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },

  accentTag: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  accentTagText: { fontSize: 10, fontWeight: '800' },

  cardTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', paddingHorizontal: 16, marginBottom: 4 },
  cardVenue: { color: '#4A8AAF', fontSize: 12, fontWeight: '500', paddingHorizontal: 16 },
  cardSchedule: {color: '#4A8AAF', fontSize: 12, fontWeight: '700', paddingHorizontal: 16 },

  miniRow: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  miniTrack: { flex: 1, height: 4, backgroundColor: '#0F1E30', borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 2 },
  miniCount: { color: '#2A4A60', fontSize: 11 },

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