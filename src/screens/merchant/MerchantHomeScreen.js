import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, ScrollView, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Foundation } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

import Header from '../../components/Header';

const { width } = Dimensions.get('window');

export default function MerchantHomeScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSold: 0,
    activeCount: 0
  });

  const [chartPeriod, setChartPeriod] = useState('week');

  const chartData = {
    week: [
      { value: 12000, label: 'Mon' },
      { value: 15000, label: 'Tue' },
      { value: 22000, label: 'Wed' },
      { value: 18000, label: 'Thu' },
      { value: 25000, label: 'Fri' },
      { value: 38000, label: 'Sat' },
      { value: 45000, label: 'Sun' }
    ],
    month: [
      { value: 55000, label: 'Wk 1' },
      { value: 68000, label: 'Wk 2' },
      { value: 120000, label: 'Wk 3' },
      { value: 95000, label: 'Wk 4' }
    ],
    year: [
      { value: 200000, label: 'Jan' },
      { value: 250000, label: 'Feb' },
      { value: 180000, label: 'Mar' },
      { value: 300000, label: 'Apr' },
      { value: 450000, label: 'May' },
      { value: 380000, label: 'Jun' },
      { value: 420000, label: 'Jul' },
      { value: 500000, label: 'Aug' },
      { value: 350000, label: 'Sep' },
      { value: 600000, label: 'Oct' },
      { value: 750000, label: 'Nov' },
      { value: 950000, label: 'Dec' }
    ]
  };

  const fetchMerchantData = async () => {
    try {
      const headers = {
        "Authorization": `Bearer ${userInfo?.token}`,
        "Accept": "application/json",
      };

      const [eventsResponse, salesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/merchant/events`, { method: 'GET', headers }),
        fetch(`${API_BASE_URL}/merchant/sales`, { method: 'GET', headers })
      ]);

      if (!eventsResponse.ok) console.log("Events API Error:", eventsResponse.status);
      if (!salesResponse.ok) console.log("Sales API Error:", salesResponse.status);

      let sold = 0;
      let active = 0;
      let revenue = 0;

      if (eventsResponse.ok) {
        const eventsResult = await eventsResponse.json();
        const eventData = eventsResult.data || eventsResult.events || eventsResult;
        const fetchedEvents = Array.isArray(eventData) ? eventData : [];
        setEvents(fetchedEvents);

        sold = fetchedEvents.reduce((acc, curr) => acc + (Number(curr.tickets_sold) || 0), 0);
        active = fetchedEvents.filter(e => e.status === 1 || e.status === '1').length;
      } else {
        Alert.alert("Events Error", `Could not load events. Status: ${eventsResponse.status}`);
      }

      if (salesResponse.ok) {
        const salesResult = await salesResponse.json();

        revenue = Number(salesResult.total_sales) || 0;

      } else {
        const errorText = await salesResponse.text();
        console.warn(`⚠️ Sales Error - Status: ${salesResponse.status}`);
        console.warn(`Backend says:`, errorText);
      }

      setStats({ totalRevenue: revenue, totalSold: sold, activeCount: active });

    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Connection Error", "Check your internet connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userInfo?.token) {
      fetchMerchantData();
    }
  }, [userInfo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMerchantData();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

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
            <View style={styles.businessHeader}>
              <Text style={styles.welcomeText}>MERCHANT PORTAL</Text>
              <Text style={styles.businessName}>Performance Overview</Text>
            </View>

            <View style={styles.statsBar}>
              {[
                { value: stats.totalSold, label: 'TICKETS SOLD', color: '#FFFFFF' },
                { value: formatCurrency(stats.totalRevenue), label: 'TOTAL   REVENUE', color: '#00C2FF' },
                { value: stats.activeCount, label: 'ACTIVE EVENTS', color: '#00E5A0' },
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

            {/* Revenue Overview Chart */}
            <View style={styles.chartSection}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Revenue Overview</Text>
                <View style={styles.tabContainer}>
                  {['week', 'month', 'year'].map((period) => (
                    <TouchableOpacity
                      key={period}
                      onPress={() => setChartPeriod(period)}
                      style={[styles.tabBtn, chartPeriod === period && styles.tabBtnActive]}
                    >
                      <Text style={[styles.tabText, chartPeriod === period && styles.tabTextActive]}>
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.chartCardWrapper}>
                <LineChart
                  areaChart
                  data={chartData[chartPeriod]}
                  hideDataPoints
                  spacing={(width - 90) / Math.max(chartData[chartPeriod].length - 1, 1)}
                  color="#00C2FF"
                  thickness={3}
                  startFillColor="rgba(0, 194, 255, 0.4)"
                  endFillColor="rgba(0, 194, 255, 0.01)"
                  initialSpacing={20}
                  endSpacing={20}
                  noOfSections={4}
                  maxValue={Math.max(...chartData[chartPeriod].map(d => d.value)) * 1.2}
                  yAxisColor="transparent"
                  yAxisTextStyle={{ color: '#4A8AAF', fontSize: 9 }}
                  xAxisColor="transparent"
                  xAxisLabelTextStyle={{ color: '#4A8AAF', fontSize: 10 }}
                  rulesType="solid"
                  rulesColor="rgba(74, 138, 175, 0.1)"
                  yAxisLabelFormatter={(val) => {
                    if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `₱${(val / 1000).toFixed(0)}k`;
                    return `₱${val}`;
                  }}
                  isAnimated
                  animationDuration={1000}
                  focusEnabled
                  showTextOnFocus
                  focusedDataPointShape="circle"
                  focusedDataPointColor="#FFD700"
                  focusedCustomDataPoint={() => <View style={styles.focusDot} />}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Manage Active Events</Text>
                <TouchableOpacity onPress={onRefresh}>
                  <Text style={styles.refreshText}>Sync Data</Text>
                </TouchableOpacity>
              </View>

              {events.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No events found.</Text>
                </View>
              ) : (
                events.map((event) => {
                  const progress = event.event_total_tickets > 0
                    ? (event.tickets_sold / event.event_total_tickets) * 100
                    : 0;

                  return (
                    <TouchableOpacity
                      key={event.id?.toString() || Math.random().toString()}
                      style={styles.ticketCard}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('EventDetails', { event })}
                    >
                      {/* Main Event Area (Left) */}
                      <View style={styles.ticketMain}>
                        <Image source={{ uri: event.event_image_url }} style={styles.ticketThumb} />
                        <View style={styles.ticketHeaderInfo}>
                          <View style={styles.ticketTagsRow}>
                            {(() => {
                              const config = getStatusConfig(event.status);
                              return (
                                <View style={[styles.statusBadgeMain, { backgroundColor: config.color + '15', borderColor: config.color + '30' }]}>
                                  <View style={[styles.statusBadgeDot, { backgroundColor: config.color }]} />
                                  <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
                                </View>
                              );
                            })()}
                            <View style={styles.categoryBadge}>
                               <Text style={styles.categoryText} numberOfLines={1}>{event.category}</Text>
                            </View>
                          </View>
                          <Text style={styles.ticketTitle} numberOfLines={1}>{event.event_name}</Text>
                          <View style={styles.ticketMetaRow}>
                            <Foundation name="marker" size={11} color="#00C2FF" />
                            <Text style={styles.ticketMetaText} numberOfLines={1}>{event.event_venue || 'TBA'}</Text>
                          </View>
                          <View style={[styles.ticketMetaRow, { gap: 12 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Foundation name="calendar" size={11} color="#00C2FF" />
                              <Text style={styles.ticketMetaText} numberOfLines={1}>{event.event_date}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Foundation name="clock" size={11} color="#00C2FF" />
                              <Text style={styles.ticketMetaText} numberOfLines={1}>{formatTime(event.event_time)}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Vertical Cutout/Perforation */}
                      <View style={styles.tearLineVertical}>
                         <View style={styles.tearCutTop} />
                         <View style={styles.tearDotsWrapVertical}>
                           {[...Array(8)].map((_, i) => <View key={i} style={styles.tearDotVertical} />)}
                         </View>
                         <View style={styles.tearCutBottom} />
                      </View>

                      {/* Stub Area (Right) */}
                      <View style={styles.ticketStub}>
                        <View style={styles.stubData}>
                          <Text style={styles.stubValue} numberOfLines={1}>{event.tickets_sold}</Text>
                          <Text style={styles.stubLabel}>SOLD</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050A14' },
  bgOrb1: { position: 'absolute', width: 350, height: 350, borderRadius: 175, backgroundColor: '#00C2FF', top: -100, right: -150, opacity: 0.04 },
  bgOrb2: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#FF4D6A', bottom: -50, left: -100, opacity: 0.02 },
  safeArea: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#4A8AAF', marginTop: 15, fontSize: 12, fontWeight: '600' },
  scrollContent: { paddingBottom: 50 },

  businessHeader: { paddingHorizontal: 20, marginVertical: 24 },
  welcomeText: { color: '#00C2FF', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  businessName: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },

  // Stats Bar
  statsBar: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 35,
    backgroundColor: '#0B1623', borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#00C2FF',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { color: '#2E4A62', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#00C2FF', marginVertical: 6 },

  // Chart Section
  chartSection: { paddingHorizontal: 20, marginBottom: 35 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#0B1623', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#1A2A44' },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#132035' },
  tabText: { color: '#4A8AAF', fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#00C2FF' },
  chartCardWrapper: {
    backgroundColor: '#0B1623',
    borderRadius: 24,
    paddingVertical: 20,
    paddingRight: 10,
    paddingLeft: 0,
    borderWidth: 1,
    borderColor: '#132035',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden'
  },
  focusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },

  // API Events Section
  section: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  refreshText: { color: '#00C2FF', fontSize: 13, fontWeight: '600' },

  ticketCard: {
    flexDirection: 'row', backgroundColor: '#0B1623', borderRadius: 20, marginBottom: 16, 
    borderWidth: 1, borderColor: '#132035', overflow: 'hidden'
  },
  ticketMain: { flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  ticketThumb: { width: 68, height: 68, borderRadius: 12, marginRight: 12, backgroundColor: '#132035' },
  ticketHeaderInfo: { flex: 1, paddingRight: 4 },
  
  ticketTagsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  statusBadgeMain: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  categoryBadge: { flexShrink: 1, backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)' },
  categoryText: { color: '#FFD700', fontSize: 7, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  ticketTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 4, letterSpacing: -0.5 },
  ticketMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  ticketMetaText: { color: '#7E97B3', fontSize: 9, fontWeight: '600' },

  tearLineVertical: { width: 16, alignItems: 'center', position: 'relative' },
  tearCutTop: { position: 'absolute', top: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#050A14', borderWidth: 1, borderColor: '#132035', zIndex: 2 },
  tearCutBottom: { position: 'absolute', bottom: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#050A14', borderWidth: 1, borderColor: '#132035', zIndex: 2 },
  tearDotsWrapVertical: { flex: 1, justifyContent: 'space-between', paddingVertical: 18 },
  tearDotVertical: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#0F1E30' },

  ticketStub: { width: 90, padding: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A121D' },
  statusBadgeDot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  statusBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  stubData: { alignItems: 'center' },
  stubValue: { color: '#00C2FF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  stubLabel: { color: '#2E4A62', fontSize: 8, fontWeight: '800', letterSpacing: 1.5, marginTop: 1 },
  stubDivider: { width: '60%', height: 1, backgroundColor: '#132035', marginVertical: 8 },
  stubDataSmall: { alignItems: 'center' },
  stubValueSmall: { fontSize: 13, fontWeight: '800', letterSpacing: -0.5 },
  stubLabelSmall: { color: '#4A8AAF', fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginBottom: 1 },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#4A8AAF', fontSize: 14 }
});