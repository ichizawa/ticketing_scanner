import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, StatusBar, ScrollView, Image,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Foundation } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

export default function OrganizerHomeScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    scannedToday: 0,
    scannedPerEvent: 0
  });

  const fetchMerchantData = useCallback(async () => {
    try {
      const headers = {
        "Authorization": `Bearer ${userInfo?.token}`,
        "Accept": "application/json",
      };

      const response = await fetch(`${API_BASE_URL}/staff/events`, { method: 'GET', headers });

      if (response.ok) {
        const result = await response.json();
        const eventData = result.data || result.events || result;
        const fetchedEvents = Array.isArray(eventData) ? eventData : [];

        setEvents(fetchedEvents);

        // Calculate ticket scanning KPIs
        const totalScanned = fetchedEvents.reduce((sum, e) => sum + (e.scannedTickets || 0), 0);
        const scannedToday = result.scannedToday || 0;
        const avgScannedPerEvent = fetchedEvents.length > 0 ? Math.round(totalScanned / fetchedEvents.length) : 0;

        setStats({
          activeCount: fetchedEvents.filter(e => e.status === 1 || e.status === '1').length,
          scannedToday: scannedToday,
          scannedPerEvent: avgScannedPerEvent,
          totalRevenue: result.totalRevenue || 0,
          totalSold: result.totalSold || 0
        });
      } else {
        Alert.alert("Error", "Failed to fetch dashboard data.");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo?.token) fetchMerchantData();
  }, [fetchMerchantData, userInfo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMerchantData();
  };

  const handleScanNavigation = () => {
    if (navigation.canGoBack()) {
      const parent = navigation.getParent();
      parent?.navigate('ScanLogin');
    } else {
      navigation.navigate('OrganizerScanner');
    }
  };

  const getStatusConfig = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('UPCOMING')) return { label: 'UPCOMING', color: '#FFAA00' };
    if (s.includes('ONGOING') || s.includes('LIVE')) return { label: 'ONGOING', color: '#FF4D6A' };
    if (s.includes('ACTIVE')) return { label: 'ACTIVE', color: '#00E5A0' };
    if (s.includes('COMPLETED') || s.includes('PAST')) return { label: 'COMPLETED', color: '#4A5568' };
    if (s.includes('CANCELLED')) return { label: 'CANCELLED', color: '#FF5733' };
    const code = parseInt(status);
    switch (code) {
      case 0: return { label: 'UPCOMING', color: '#FFAA00' };
      case 1: return { label: 'ACTIVE', color: '#00E5A0' };
      case 2: return { label: 'ONGOING', color: '#FF4D6A' };
      case 3: return { label: 'COMPLETED', color: '#4A5568' };
      default: return { label: s || 'ACTIVE', color: '#00E5A0' };
    }
  };

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

  const activeEvents = events.filter((e) => {
    const st = String(e.status).toUpperCase();
    return st === '1' || st === 'ACTIVE' || st === 'LIVE' || st === 'ON LIVE';
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      {/* Background Decor */}
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <SafeAreaView style={styles.safeArea}>
        <Header navigation={navigation} />

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#00C2FF" />
            <Text style={styles.loadingText}>Syncing Dashboard...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C2FF" />
            }
          >
            {/* Business Header */}
            <View style={styles.businessHeader}>
              <Text style={styles.welcomeText}>ORGANIZER PORTAL</Text>
              <Text style={styles.businessName}>Event Dashboard</Text>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              {[
                { value: stats.activeCount, label: 'ACTIVE EVENTS', color: '#FFFFFF' },
                { value: stats.scannedToday, label: 'SCANNED TODAY', color: '#00C2FF' },
                { value: stats.scannedPerEvent, label: 'AVG/EVENT', color: '#00E5A0' },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <View style={styles.statDivider} />}
                  <View style={[styles.statItem, i === 1 && { flex: 2 }]}>
                    <Text style={[styles.statNumber, { color: s.color }, i === 1 && { fontSize: 24, fontWeight: '900' }]}>{s.value}</Text>
                    <Text style={[styles.statLabel, i === 1 && { color: '#4A8AAF', fontSize: 8 }]}>{s.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            {/* Events Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Active Events</Text>
                <TouchableOpacity onPress={onRefresh}>
                  <Text style={styles.refreshText}>Sync Data</Text>
                </TouchableOpacity>
              </View>

              {activeEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No active events found.</Text>
                </View>
              ) : (
                activeEvents.map((event) => {
                  const config = getStatusConfig(event.status);
                  return (
                    <TouchableOpacity
                      key={event.id?.toString() || Math.random().toString()}
                      style={styles.ticketCard}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('EventOrganizer', { event })}
                    >
                      {/* Main Event Area (Left) */}
                      <View style={styles.ticketMain}>
                        <Image source={{ uri: event.event_image_url }} style={styles.ticketThumb} />
                        <View style={styles.ticketHeaderInfo}>
                          <View style={styles.ticketTagsRow}>
                            <View style={[styles.statusBadgeMain, { backgroundColor: config.color + '15', borderColor: config.color + '30' }]}>
                              <View style={[styles.statusBadgeDot, { backgroundColor: config.color }]} />
                              <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
                            </View>
                            {event.category ? (
                              <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText} numberOfLines={1}>{event.category}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.ticketTitle} numberOfLines={1}>{event.event_name || event.name || 'Event'}</Text>
                          <View style={styles.ticketMetaRow}>
                            <Foundation name="marker" size={11} color="#00C2FF" />
                            <Text style={styles.ticketMetaText} numberOfLines={1}>{event.event_venue || event.venue || 'TBA'}</Text>
                          </View>
                          <View style={[styles.ticketMetaRow, { gap: 12 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Foundation name="calendar" size={11} color="#00C2FF" />
                              <Text style={styles.ticketMetaText} numberOfLines={1}>{event.event_date || event.date || 'TBA'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Foundation name="clock" size={11} color="#00C2FF" />
                              <Text style={styles.ticketMetaText} numberOfLines={1}>{formatTime(event.event_time || event.time)}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Vertical Tear-line */}
                      <View style={styles.tearLineVertical}>
                        <View style={styles.tearCutTop} />
                        <View style={styles.tearDotsWrapVertical}>
                          {[...Array(8)].map((_, i) => <View key={i} style={styles.tearDotVertical} />)}
                        </View>
                        <View style={styles.tearCutBottom} />
                      </View>

                      {/* Stub (Right) */}
                      <View style={styles.ticketStub}>
                        <View style={styles.stubData}>
                          <Text style={styles.stubValue} numberOfLines={1}>{event.scannedTickets ?? 0}</Text>
                          <Text style={styles.stubLabel}>SCANNED</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Action Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>

              <TouchableOpacity
                style={styles.primaryActionCard}
                onPress={handleScanNavigation}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.iconEmoji}>📷</Text>
                </View>
                <View style={styles.actionTextContent}>
                  <Text style={styles.actionTitle}>Scan Tickets</Text>
                  <Text style={styles.actionDesc}>Instant QR verification</Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#4A8AAF',
    marginTop: 15,
    fontSize: 12,
    fontWeight: '600'
  },
  scrollContent: {
    paddingBottom: 50
  },
  businessHeader: {
    paddingHorizontal: 20,
    marginVertical: 24
  },
  welcomeText: {
    color: '#00C2FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4
  },
  businessName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800'
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 35,
    backgroundColor: '#0B1623',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#00C2FF'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  statLabel: {
    color: '#2E4A62',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    backgroundColor: '#00C2FF',
    marginVertical: 6
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  refreshText: {
    color: '#00C2FF',
    fontSize: 13,
    fontWeight: '600'
  },
  primaryActionCard: {
    backgroundColor: 'rgba(0, 194, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.2)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 194, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconEmoji: {
    fontSize: 22
  },
  actionTextContent: {
    flex: 1,
    marginLeft: 15
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700'
  },
  actionDesc: {
    color: '#8A94A6',
    fontSize: 13,
    marginTop: 2
  },
  arrowIcon: {
    color: '#00C2FF',
    fontSize: 20,
    fontWeight: 'bold'
  },
  // Ticket Card
  ticketCard: {
    flexDirection: 'row', backgroundColor: '#0B1623', borderRadius: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#132035', overflow: 'hidden'
  },
  ticketMain: { flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  ticketThumb: { width: 68, height: 68, borderRadius: 12, marginRight: 12, backgroundColor: '#132035' },
  ticketHeaderInfo: { flex: 1, paddingRight: 4 },
  ticketTagsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  statusBadgeMain: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  statusBadgeDot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  statusBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  categoryBadge: { flexShrink: 1, backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  categoryText: { color: '#FFD700', fontSize: 7, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  ticketTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 4, letterSpacing: -0.5 },
  ticketMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  ticketMetaText: { color: '#7E97B3', fontSize: 9, fontWeight: '600' },
  tearLineVertical: { width: 16, alignItems: 'center', position: 'relative' },
  tearCutTop: { position: 'absolute', top: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#050A14', borderWidth: 1, borderColor: '#132035', zIndex: 2 },
  tearCutBottom: { position: 'absolute', bottom: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#050A14', borderWidth: 1, borderColor: '#132035', zIndex: 2 },
  tearDotsWrapVertical: { flex: 1, justifyContent: 'space-between', paddingVertical: 18 },
  tearDotVertical: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#0F1E30' },
  ticketStub: { width: 80, padding: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A121D' },
  stubData: { alignItems: 'center' },
  stubValue: { color: '#00C2FF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  stubLabel: { color: '#2E4A62', fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginTop: 1 },
  emptyState: {
    alignItems: 'flex-start',
    paddingVertical: 8
  },
  emptyText: {
    color: '#4A8AAF',
    fontSize: 13,
    fontStyle: 'italic'
  },
  bgOrb1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#00C2FF',
    top: -100,
    right: -150,
    opacity: 0.04
  },
  bgOrb2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FF4D6A',
    bottom: -50,
    left: -100,
    opacity: 0.02
  }
});