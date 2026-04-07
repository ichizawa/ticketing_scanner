import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, ScrollView, Animated, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import React, { useRef, useEffect, useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import NetInfo from '@react-native-community/netinfo'
import { AuthContext } from '../../context/AuthContext'
import Header from '../../components/Header'
import { API_BASE_URL } from '../../config'; 


const { width } = Dimensions.get('window')

const formatTime = (time) => {
  if (!time) return 'TBA'
  try {
    const parts = time.split(':')
    if (parts.length < 2) return time
    let h = parseInt(parts[0], 10)
    const m = parts[1]
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m} ${ampm}`
  } catch (e) {
    return time
  }
}

const getStatusConfig = (statusCode) => {
  switch (statusCode) {
    case 0: return { label: 'UPCOMING', color: '#FFAA00' }
    case 1: return { label: 'ACTIVE', color: '#00E5A0' }
    case 2: return { label: 'ONGOING', color: '#00C2FF' }
    case 3: return { label: 'COMPLETED', color: '#4B4B4B' }
    default: return { label: 'CANCELLED', color: '#FF4D6A' }
  }
}

const transformEvent = (apiEvent) => {
  const statusConfig = getStatusConfig(apiEvent.status)
  const statusStr = String(apiEvent.status || '').toUpperCase()

  return {
    id: apiEvent.id?.toString() || Math.random().toString(),
    name: apiEvent.event_name || 'Unnamed Event',
    venue: apiEvent.event_venue || 'TBA',
    date: `${apiEvent.event_date || 'TBA'} • ${formatTime(apiEvent.event_time)}`,
    status: statusConfig.label,
    statusColor: statusConfig.color,
    accentColor: statusConfig.color,
    statusCode: apiEvent.status,
    totalCheckedIn: 0, 
    totalCapacity: 0,  
    categories: [],    
  }
}

const BgOrbs = () => (
  <>
    <View style={styles.bgOrb1} />
    <View style={styles.bgOrb2} />
  </>
)

function EventSelectionView({ onSelect, navigation }) {
  const { userInfo } = useContext(AuthContext)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(true)

  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(Boolean(state.isConnected))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (userInfo?.token) {
      fetchEvents()
    } else {
      setLoading(false)
      setError('Please login to view events')
    }
  }, [userInfo])

  const fetchEvents = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true)
      setError(null)

      if (!isConnected) throw new Error('No internet connection')
      if (!userInfo?.token) throw new Error('Not authenticated')

      const response = await fetch(`${API_BASE_URL}/staff/events`, {
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Accept": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const json = await response.json()
      const eventData = json.data || json.events || json

    
      const transformedEvents = await Promise.all(
        (Array.isArray(eventData) ? eventData : []).map(async (apiEvent) => {
          const baseEvent = transformEvent(apiEvent)

        
          try {
            const [scanResponse, ticketsResponse] = await Promise.all([
              fetch(`${API_BASE_URL}/staff/tickets/scanned?event_id=${apiEvent.id}`, {
                headers: {
                  "Authorization": `Bearer ${userInfo.token}`,
                  "Accept": "application/json"
                }
              }),
              fetch(`${API_BASE_URL}/staff/tickets`, {
                headers: {
                  "Authorization": `Bearer ${userInfo.token}`,
                  "Accept": "application/json"
                }
              })
            ])

            // Get scanned count
            let scannedCount = 0
            if (scanResponse.ok) {
              const scanJson = await scanResponse.json()
              scannedCount = typeof scanJson.data === 'number' ? scanJson.data : 0
            }

            // Get total capacity and categories
            let totalCapacity = 0
            let categories = []
            if (ticketsResponse.ok) {
              const ticketsJson = await ticketsResponse.json()
              const allTickets = ticketsJson.data || ticketsJson.tickets || ticketsJson
              const eventTickets = Array.isArray(allTickets)
                ? allTickets.filter(t => t.event_id == apiEvent.id)
                : []

              totalCapacity = eventTickets.reduce((sum, t) => sum + (parseInt(t.original_qty) || 0), 0)

              const ticketTypes = {}
              eventTickets.forEach(ticket => {
                const typeName = ticket.type || 'General'
                if (!ticketTypes[typeName]) {
                  ticketTypes[typeName] = {
                    id: Object.keys(ticketTypes).length + 1,
                    name: typeName,
                    checkedIn: 0, 
                    capacity: 0,
                    color: '#00C2FF', 
                    icon: '🎫'
                  }
                }
                ticketTypes[typeName].capacity += parseInt(ticket.original_qty) || 0
              })

              categories = Object.values(ticketTypes)
            }

            return {
              ...baseEvent,
              totalCheckedIn: scannedCount,
              totalCapacity: totalCapacity,
              categories: categories
            }
          } catch (err) {
            console.error(`Error fetching data for event ${apiEvent.id}:`, err)
            return baseEvent 
          }
        })
      )

      setEvents(transformedEvents)
    } catch (err) {
      setError(err.message || 'Failed to load events')
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
      if (isRefresh) setRefreshing(false)
    }
  }

  const onRefresh = () => {
    if (isConnected) {
      setRefreshing(true)
      fetchEvents(true)
    } else {
      setError('No internet connection')
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgOrbs />
        <SafeAreaView style={styles.safeArea}>
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00C2FF" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgOrbs />
        <SafeAreaView style={styles.safeArea}>
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchEvents()}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <BgOrbs />

      <SafeAreaView style={styles.safeArea}>

       <Header navigation={navigation} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C2FF" />}
        >

          <View style={styles.pageHeadRow}>
            <View>
              <Text style={styles.pageHeadTitle}>All Events</Text>
              <Text style={styles.pageHeadSub}>Tap an event to view attendee analytics</Text>
            </View>
            <Animated.View style={[styles.pulseOrb, { transform: [{ scale: pulseAnim }] }]} />
          </View>

          {!isConnected && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerTitle}>OFFLINE</Text>
              <Text style={styles.offlineBannerText}>Connect to the internet to get live attendance updates.</Text>
            </View>
          )}

          <View style={styles.searchBar}>
            <Text style={styles.searchIconChar}>⌕</Text>
            <Text style={styles.searchPlaceholder}>Search events…</Text>
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {['ALL', 'LIVE', 'UPCOMING', 'PAST'].map((f, i) => (
              <View key={f} style={[styles.chip, i === 0 && styles.chipActive]}>
                <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{f}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Event cards */}
          {events.map((ev) => {
            const pct = ev.totalCapacity > 0
              ? Math.round((ev.totalCheckedIn / ev.totalCapacity) * 100) : 0
            const isLive = ev.status === 'ACTIVE' || ev.status === 'ONGOING'

            return (
              <TouchableOpacity
                key={ev.id}
                style={[styles.eventCard, isLive && { borderColor: ev.accentColor + '55' }]}
                onPress={() => onSelect(ev)}
                activeOpacity={0.8}
              >
                {/* Top row */}
                <View style={styles.eventCardTop}>
                  <View style={[styles.statusPill, { backgroundColor: ev.statusColor + '18' }]}>
                    {isLive && <View style={[styles.statusDot, { backgroundColor: ev.statusColor }]} />}
                    <Text style={[styles.statusText, { color: ev.statusColor }]}>{ev.status}</Text>
                  </View>
                  <View style={[
                    styles.pctBadge,
                    { backgroundColor: ev.accentColor + '18', borderColor: ev.accentColor + '33' },
                  ]}>
                    <Text style={[styles.pctBadgeText, { color: ev.accentColor }]}>
                      {pct}% CHECKED IN
                    </Text>
                  </View>
                </View>

                {/* Info */}
                <Text style={styles.eventCardName}>{ev.name}</Text>
                <Text style={styles.eventCardVenue}>{ev.venue}</Text>
                <Text style={[styles.eventCardDate, { color: ev.accentColor }]}>{ev.date}</Text>

                {/* Counts */}
                <View style={styles.eventCardCounts}>
                  <Text style={styles.countHighlight}>{ev.totalCheckedIn.toLocaleString()}</Text>
                  <Text style={styles.countMuted}> / {ev.totalCapacity.toLocaleString()} checked in</Text>
                </View>

                {/* Mini progress */}
                <View style={styles.miniProgressTrack}>
                  <View style={[styles.miniProgressFill, { width: `${pct}%`, backgroundColor: ev.accentColor }]} />
                </View>

                {/* Category pills */}
                <View style={styles.catPillRow}>
                  {ev.categories.slice(0, 3).map((c) => (
                    <View key={c.id} style={[styles.catPill, { backgroundColor: c.color + '18' }]}>
                      <Text style={styles.catPillText}>{c.icon} {c.name}</Text>
                    </View>
                  ))}
                  {ev.categories.length > 3 && (
                    <View style={[styles.catPill, { backgroundColor: '#4A8AAF18' }]}>
                      <Text style={styles.catPillText}>+{ev.categories.length - 3} more</Text>
                    </View>
                  )}
                </View>

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: isLive ? ev.accentColor + '22' : '#0F1E30' }]}>
                  <Text style={[styles.cardFooterText, { color: ev.accentColor }]}>
                    VIEW ATTENDANCE REPORT  ›
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}

          {events.length === 0 && (
            <View style={[styles.centerContainer, { marginTop: 60 }]}>
              <Text style={styles.noDataText}>No events found</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function AttendanceReportView({ event, onBack, handleLogout, navigation }) {
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: event.totalCapacity > 0
        ? event.totalCheckedIn / event.totalCapacity : 0,
      duration: 1500,
      useNativeDriver: false,
    }).start()
  }, [event])

  const mainProgressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  const overallPct = event.totalCapacity > 0
    ? Math.round((event.totalCheckedIn / event.totalCapacity) * 100) : 0

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <BgOrbs />

      <SafeAreaView style={styles.safeArea}>
        <Header navigation={navigation} onBack={onBack} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Main Counter Card */}
          <View style={[styles.mainCard, { shadowColor: event.accentColor }]}>
            <View style={styles.mainHeader}>
              <View>
                <Text style={styles.mainLabel}>TOTAL CHECKED-IN</Text>
                <Text style={styles.mainCount}>
                  {event.totalCheckedIn.toLocaleString()}
                  <Text style={styles.mainCapacity}> / {event.totalCapacity.toLocaleString()}</Text>
                </Text>
              </View>
              <View style={[styles.liveIndicator, { backgroundColor: event.statusColor + '18' }]}>
                <View style={[styles.liveDot, { backgroundColor: event.statusColor }]} />
                <Text style={[styles.liveText, { color: event.statusColor }]}>{event.status}</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { width: mainProgressWidth, backgroundColor: event.accentColor },
                ]}
              />
              <View style={[styles.progressGlow, { backgroundColor: event.accentColor }]} />
            </View>

            <View style={styles.percentRow}>
              <Text style={styles.percentText}>{overallPct}% Capacity Reached</Text>
              <Text style={styles.remainingText}>
                {(event.totalCapacity - event.totalCheckedIn).toLocaleString()} Remaining
              </Text>
            </View>
          </View>

          {/* Venue & Date strip */}
          <View style={styles.eventMetaStrip}>
            <Text style={styles.eventMetaVenue}>📍 {event.venue}</Text>
            <Text style={[styles.eventMetaDate, { color: event.accentColor }]}>{event.date}</Text>
          </View>

          <Text style={styles.sectionTitle}>Ticket Categories</Text>

          {/* Category Cards */}
          {event.categories.map((cat) => {
            const percent = cat.capacity > 0
              ? (cat.checkedIn / cat.capacity) * 100 : 0
            return (
              <View key={cat.id} style={styles.catCard}>
                <View style={styles.catInfo}>
                  <View style={[styles.catIconBox, { backgroundColor: cat.color + '20' }]}>
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catMeta}>
                      {cat.checkedIn} checked in out of {cat.capacity}
                    </Text>
                  </View>
                  <Text style={[styles.catPercent, { color: cat.color }]}>
                    {Math.round(percent)}%
                  </Text>
                </View>
                <View style={styles.catProgressBg}>
                  <View
                    style={[
                      styles.catProgressBar,
                      { width: `${percent}%`, backgroundColor: cat.color },
                    ]}
                  />
                </View>
              </View>
            )
          })}

          {/* Switch event pill */}
          <TouchableOpacity style={styles.switchBtn} onPress={onBack}>
            <Text style={styles.switchBtnText}>⇄  SWITCH EVENT</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

export default function AttendeeTrackScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [selectedEvent, setSelectedEvent] = useState(null)

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Logout',
          onPress: () => logout(),
          style: 'destructive'
        }
      ]
    );
  };

  if (!selectedEvent) {
    return (
      <EventSelectionView 
        onSelect={setSelectedEvent} 
        navigation={navigation}
        handleLogout={handleLogout}
      />
    )
  }
  
  return (
    <AttendanceReportView
      event={selectedEvent}
      onBack={() => setSelectedEvent(null)}
      handleLogout={handleLogout}
      navigation={navigation}
    />
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050A14' },

  bgOrb1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#00C2FF', top: -50, right: -50, opacity: 0.05,
  },
  bgOrb2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#FF4D6A', bottom: 100, left: -50, opacity: 0.05,
  },

  safeArea:      { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

  pageHeadRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageHeadTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
  pageHeadSub:   { color: '#3D6080', fontSize: 13, fontWeight: '500' },
  pulseOrb: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#00E5A0',
    shadowColor: '#00E5A0', shadowOpacity: 0.9, shadowRadius: 8, elevation: 6,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1623',
    borderRadius: 14, borderWidth: 1, borderColor: '#132035',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, gap: 10,
  },
  searchIconChar:    { color: '#3D6080', fontSize: 18 },
  searchPlaceholder: { color: '#1E3A50', fontSize: 14, fontWeight: '500' },

  chipsRow:       { marginBottom: 20 },
  chip:           { borderRadius: 20, borderWidth: 1, borderColor: '#132035', paddingHorizontal: 16, paddingVertical: 7, marginRight: 8, backgroundColor: '#0B1623' },
  chipActive:     { backgroundColor: '#00C2FF', borderColor: '#00C2FF' },
  chipText:       { color: '#3D6080', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  chipTextActive: { color: '#050A14' },

  eventCard: {
    backgroundColor: '#0B1623', borderRadius: 20, borderWidth: 1,
    borderColor: '#132035', marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  eventCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingBottom: 10,
  },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  pctBadge:   { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  pctBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  eventCardName:     { color: '#FFFFFF', fontSize: 17, fontWeight: '800', paddingHorizontal: 16, marginBottom: 3, letterSpacing: -0.3 },
  eventCardVenue:    { color: '#3D6080', fontSize: 12, fontWeight: '500', paddingHorizontal: 16, marginBottom: 2 },
  eventCardDate:     { fontSize: 12, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12, letterSpacing: 0.3 },

  eventCardCounts: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 16, marginBottom: 10 },
  countHighlight:  { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  countMuted:      { color: '#3D6080', fontSize: 13, fontWeight: '500' },

  miniProgressTrack: { height: 5, backgroundColor: '#0F1E30', borderRadius: 3, marginHorizontal: 16, overflow: 'hidden', marginBottom: 14 },
  miniProgressFill:  { height: '100%', borderRadius: 3 },

  catPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, marginBottom: 0 },
  catPill:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  catPillText:{ color: '#FFFFFF', fontSize: 10, fontWeight: '600', opacity: 0.8 },

  cardFooter:     { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, marginTop: 14 },
  cardFooterText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },

  mainCard: {
    backgroundColor: '#0B1623', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#132035', marginBottom: 16,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
  },
  mainHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  mainLabel:    { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  mainCount:    { color: '#FFFFFF', fontSize: 40, fontWeight: '800', marginTop: 4 },
  mainCapacity: { color: '#3D6080', fontSize: 20, fontWeight: '600' },

  liveIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  liveDot:       { width: 6, height: 6, borderRadius: 3 },
  liveText:      { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  progressContainer: { height: 12, backgroundColor: '#132035', borderRadius: 6, overflow: 'hidden', marginVertical: 12 },
  progressBar:       { height: '100%', borderRadius: 6 },
  progressGlow:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 },

  percentRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  percentText:    { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  remainingText:  { color: '#3D6080', fontSize: 12, fontWeight: '600' },

  eventMetaStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0B1623', borderRadius: 14, borderWidth: 1, borderColor: '#132035',
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24,
  },
  eventMetaVenue: { color: '#3D6080', fontSize: 12, fontWeight: '600' },
  eventMetaDate:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 20, paddingLeft: 4 },

  catCard: {
    backgroundColor: '#0B1623', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#132035', marginBottom: 16,
  },
  catInfo:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  catIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  catIcon:    { fontSize: 20 },
  catName:    { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  catMeta:    { color: '#3D6080', fontSize: 11, fontWeight: '500' },
  catPercent: { fontSize: 18, fontWeight: '800' },

  catProgressBg:  { height: 6, backgroundColor: '#132035', borderRadius: 3, overflow: 'hidden' },
  catProgressBar: { height: '100%', borderRadius: 3 },

  switchBtn: {
    alignSelf: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#132035',
    paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#0B1623', marginTop: 4,
  },
  switchBtnText: { color: '#3D6080', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

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
  retryText: { color: '#4A8AAF', fontSize: 12, fontWeight: '800' },

  offlineBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#3B1118',
    borderWidth: 1,
    borderColor: '#6D2430',
  },
  offlineBannerTitle: {
    color: '#FFD5DB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  offlineBannerText: {
    color: '#FFB7C2',
    fontSize: 12,
  },
})