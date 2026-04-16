import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Dimensions, 
  StatusBar, ScrollView, Image, Alert, ActivityIndicator, 
  RefreshControl, LayoutAnimation, Platform, UIManager 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Foundation } from '@expo/vector-icons';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
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
  const [chartData, setChartData] = useState({ week: [], month: [], year: [] });
  const [baseScale, setBaseScale] = useState(1);
  const [pinchScale, setPinchScale] = useState(1);

  const chartPeriods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' }
  ];

  const selectedChartData = chartData[chartPeriod] || [];
  const selectedChartLabel = chartPeriod === 'week'
    ? 'Last 7 days'
    : chartPeriod === 'month'
      ? 'Last 30 days'
      : 'Last 12 months';

  const onPinchEvent = (event) => {
    setPinchScale(event.nativeEvent.scale);
  };

  const onPinchStateChange = (event) => {
    if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      let currentScale = baseScale * event.nativeEvent.scale;
      currentScale = Math.min(Math.max(currentScale, 0.5), 6);
      setBaseScale(currentScale);
      setPinchScale(1);
    }
  };

  const zoomFactor = Math.min(Math.max(baseScale * pinchScale, 0.5), 6);

  const calculatePeriodTotal = () => {
    return selectedChartData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  };

  const calculateSpacing = () => {
    const points = Math.max(selectedChartData.length - 1, 1);
    return Math.max((width - 90) / points, 18);
  };

  // Enable LayoutAnimation for Android smooth transitions
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const normalizeSeries = (items, labelField = 'label', valueField = 'value') => {
    if (!Array.isArray(items)) return [];

    return items.map((item, index) => {
      if (typeof item === 'number') {
        return { value: item, label: `#${index + 1}` };
      }
      if (typeof item === 'string') {
        return { value: 0, label: item };
      }

      const value = Number(item[valueField] ?? item.value ?? item.amount ?? item.revenue ?? item.total) || 0;
      let rawLabel = String(item[labelField] ?? item.name ?? item.day ?? item.period ?? item.date ?? item.label ?? '');
      
      // Smart date formatting if possible
      let label = rawLabel;
      if (rawLabel.includes('-') && rawLabel.length >= 7) {
        try {
          const d = new Date(rawLabel);
          if (!isNaN(d.getTime())) {
            if (chartPeriod === 'week') {
              label = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue
            } else if (chartPeriod === 'month') {
              label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // Apr 15
            } else if (chartPeriod === 'year') {
              label = d.toLocaleDateString('en-US', { month: 'short' }); // Jan, Feb
            }
          }
        } catch (e) {
          label = rawLabel.substring(0, 12);
        }
      } else {
        label = rawLabel.substring(0, 12);
      }

      return { value, label };
    });
  };

  const buildChartDataFromSales = (salesResult) => {
    if (!salesResult || typeof salesResult !== 'object') {
      return { week: [], month: [], year: [] };
    }

    // Ensures we always have at least 2 points to draw a line
    const ensureTwoPoints = (data) => {
      if (data.length === 1) {
        return [{ value: 0, label: '' }, data[0]];
      }
      return data;
    };

    let week = normalizeSeries(salesResult.week || salesResult.weekly || salesResult.week_data);
    let month = normalizeSeries(salesResult.month || salesResult.monthly || salesResult.month_data);
    let year = normalizeSeries(salesResult.year || salesResult.yearly || salesResult.year_data);

    if (week.length || month.length || year.length) {
      return {
        week: ensureTwoPoints(week),
        month: ensureTwoPoints(month),
        year: ensureTwoPoints(year)
      };
    }

    const totalValue = Number(salesResult.total_sales ?? salesResult.totalSales ?? salesResult.totalRevenue ?? salesResult.revenue ?? 0) || 0;
    if (totalValue > 0) {
      const fallback = [
        { value: 0, label: '' },
        { value: totalValue, label: 'Total' }
      ];
      return { week: fallback, month: fallback, year: fallback };
    }

    if (Array.isArray(salesResult.data)) {
      const normalized = ensureTwoPoints(normalizeSeries(salesResult.data));
      return { week: normalized, month: normalized, year: normalized };
    }

    if (salesResult.data && typeof salesResult.data === 'object') {
      return {
        week: ensureTwoPoints(normalizeSeries(salesResult.data.week || salesResult.data.weekly || salesResult.data.week_data)),
        month: ensureTwoPoints(normalizeSeries(salesResult.data.month || salesResult.data.monthly || salesResult.data.month_data)),
        year: ensureTwoPoints(normalizeSeries(salesResult.data.year || salesResult.data.yearly || salesResult.data.year_data))
      };
    }

    if (Array.isArray(salesResult.chart)) {
      const normalized = ensureTwoPoints(normalizeSeries(salesResult.chart));
      return { week: normalized, month: normalized, year: normalized };
    }

    return { week: [], month: [], year: [] };
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
        const revenueChartData = buildChartDataFromSales(salesResult);
        setChartData(revenueChartData);
      } else {
        setChartData({ week: [], month: [], year: [] });
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

  const maxVal = Math.max(...selectedChartData.map(d => d.value), 0);
  let chartStepValue = 100;
  let chartNoOfSections = 4;

  if (maxVal > 0) {
    const idealStep = (maxVal * 1.2) / chartNoOfSections;
    const magnitude = Math.pow(10, Math.floor(Math.log10(idealStep)));
    const normalizedStep = idealStep / magnitude;
    
    let stepMultiplier = 1;
    if (normalizedStep > 5) stepMultiplier = 10;
    else if (normalizedStep > 2.5) stepMultiplier = 5;
    else if (normalizedStep > 2) stepMultiplier = 2.5;
    else if (normalizedStep > 1) stepMultiplier = 2;
    
    chartStepValue = stepMultiplier * magnitude;
  }
  const chartMaxValue = chartStepValue * chartNoOfSections;

  // Active events filter wrapper
  const activeEventsList = events.filter((e) => {
    const st = String(e.status).toUpperCase();
    return st === '1' || st === 'ACTIVE' || st === 'LIVE' || st === 'ON LIVE';
  });

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
                {/* Header Top Row: Title & Period Total */}
                <View style={styles.chartHeaderTop}>
                  <View>
                    <Text style={styles.sectionTitle}>Revenue Overview</Text>
                    <Text style={styles.chartSubtitle}>{selectedChartLabel}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.periodTotalValue}>{formatCurrency(calculatePeriodTotal())}</Text>
                    <Text style={styles.periodTotalTitle}>PERIOD REVENUE</Text>
                  </View>
                </View>

                {/* Period Tab */}
                <View style={styles.chartTabsWrapper}>
                  <View style={styles.tabContainer}>
                    {chartPeriods.map(({ key, label }) => {
                      const hasData = (chartData[key] || []).length > 0;
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setChartPeriod(key);
                            setBaseScale(1);
                          }}
                          style={[
                            styles.tabBtn,
                            chartPeriod === key && styles.tabBtnActive,
                            !hasData && styles.tabBtnDisabled
                          ]}
                          activeOpacity={hasData ? 0.7 : 1}
                          disabled={!hasData}
                        >
                          <Text style={[styles.tabText, chartPeriod === key && styles.tabTextActive, !hasData && styles.tabTextDisabled]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.chartCardWrapper}>
                {selectedChartData.length > 0 ? (
                  <PinchGestureHandler
                    onGestureEvent={onPinchEvent}
                    onHandlerStateChange={onPinchStateChange}
                  >
                    <View>
                      <LineChart
                        areaChart
                        curved
                        data={selectedChartData}
                        width={width - 85} 
                        hideDataPoints={false}
                        dataPointsColor="#00E5A0"
                        dataPointsRadius={4}
                        spacing={calculateSpacing() * zoomFactor}
                        color="#00C2FF"
                        thickness={3}
                        startFillColor="rgba(0, 194, 255, 0.28)"
                        endFillColor="rgba(0, 194, 255, 0.02)"
                        initialSpacing={20 * zoomFactor}
                        endSpacing={20 * zoomFactor}
                        topSpacing={30}
                        bottomSpacing={10}
                        noOfSections={chartNoOfSections}
                        stepValue={chartStepValue}
                        maxValue={chartMaxValue}
                        yAxisColor="transparent"
                        yAxisTextStyle={{ color: '#7E97B3', fontSize: 10, fontWeight: '600' }}
                        xAxisColor="transparent"
                        xAxisLabelTextStyle={{ color: '#7E97B3', fontSize: 10, marginBottom: 4 }}
                        rulesType="dashed"
                        dashWidth={4}
                        dashGap={4}
                        rulesColor="rgba(74, 138, 175, 0.12)"
                        yAxisLabelFormatter={(val) => {
                          if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
                          if (val >= 1000) return `₱${(val / 1000).toFixed(0)}k`;
                          return `₱${Math.round(val)}`;
                        }}
                        isAnimated
                        animationDuration={900}
                        scrollAnimation={true}
                        pointerConfig={{
                          pointerStripHeight: 170,
                          pointerStripColor: 'rgba(0, 194, 255, 0.15)',
                          pointerStripWidth: 2,
                          pointerColor: '#00C2FF',
                          radius: 5,
                          pointerLabelWidth: 100,
                          pointerLabelHeight: 76,
                          activatePointersOnLongPress: true,
                          autoAdjustPointerLabelPosition: true,
                          pointerComponent: () => (
                            <View style={styles.focusDot} />
                          ),
                          pointerLabelComponent: items => (
                            <View style={styles.tooltipBox}>
                              <Text style={styles.tooltipLabel}>{items[0].label || selectedChartLabel}</Text>
                              <Text style={styles.tooltipValue}>₱{items[0].value.toLocaleString()}</Text>
                            </View>
                          ),
                        }}
                      />
                    </View>
                  </PinchGestureHandler>
                ) : (
                  <View style={styles.emptyChartState}>
                    <Text style={styles.emptyText}>No revenue history available yet.</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Manage Active Events</Text>
                <TouchableOpacity onPress={onRefresh}>
                  <Text style={styles.refreshText}>Sync Data</Text>
                </TouchableOpacity>
              </View>

              {activeEventsList.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No active events found.</Text>
                </View>
              ) : (
                activeEventsList.map((event) => {
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
  chartHeader: { marginBottom: 18 },
  chartHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  chartTabsWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  chartSubtitle: { color: '#7E97B3', fontSize: 12, marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#0B1623', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#1A2A44' },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, marginHorizontal: 2 },
  tabBtnActive: { backgroundColor: '#0C2C4A' },
  tabBtnDisabled: { opacity: 0.35 },
  tabText: { color: '#A3B7D6', fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#00C2FF' },
  tabTextDisabled: { color: '#5D6D7E' },
  chartCardWrapper: {
    backgroundColor: '#0B1623',
    borderRadius: 24,
    paddingVertical: 18,
    paddingRight: 15,
    paddingLeft: 5,
    borderWidth: 1,
    borderColor: '#132035',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'visible' 
  },
  emptyChartState: {
    height: 220,
    alignItems: 'center',
    justify相对于: 'center'
  },
  focusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  tooltipBox: {
    backgroundColor: '#132035',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00C2FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginTop: -30, 
  },
  periodTotalValue: { color: '#00C2FF', fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  periodTotalTitle: { color: '#4A8AAF', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: -2 },
  tooltipLabel: {
    color: '#4A8AAF',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  tooltipValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
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

  // Empty State
  emptyState: {alignItems: 'start' },
  emptyText: { color: '#4A8AAF', fontSize: 13, fontStyle: 'italic' },
});