import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, ScrollView, Animated, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native'
import React, { useRef, useEffect, useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import NetInfo from '@react-native-community/netinfo'
import { Foundation, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { AuthContext } from '../../context/AuthContext'
import Header from '../../components/Header'
import { API_BASE_URL } from '../../config'; 


const { width, height } = Dimensions.get('window')

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

const transformEvent = (apiEvent) => {
  const statusConfig = getStatusConfig(apiEvent.status)

  return {
    id: apiEvent.id?.toString() || Math.random().toString(),
    name: apiEvent.event_name || 'Unnamed Event',
    venue: apiEvent.event_venue || 'TBA',
    date: apiEvent.event_date || 'TBA',
    time: formatTime(apiEvent.event_time),
    status: statusConfig.label,
    statusColor: statusConfig.color,
    accentColor: statusConfig.color,
    statusCode: apiEvent.status,
    totalCheckedIn: 0, 
    totalCapacity: 0,  
    categories: [],    
    image: apiEvent.event_image_url || null,
    category: apiEvent.category || null,
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
  const [activeTab, setActiveTab] = useState('All Events')
  const TABS = ['All Events', 'Upcoming', 'Ongoing', 'Completed', 'Active', 'Cancelled']
  const TAB_DOTS = Math.ceil(TABS.length / 2)
  const [tabScrollIndex, setTabScrollIndex] = useState(0)
  const tabScrollRef = useRef(null)
  const [isConnected, setIsConnected] = useState(true)

  const getFilteredEvents = () => {
    if (activeTab === 'All Events') return events;
    return events.filter(event => {
      const statusStr = String(event.status || '').toUpperCase();
      switch (activeTab) {
        case 'Upcoming': return event.statusCode === 0 || statusStr === 'UPCOMING';
        case 'Ongoing':  return event.statusCode === 2 || statusStr === 'ONGOING';
        case 'Completed':return event.statusCode === 3 || statusStr === 'COMPLETED' || statusStr === 'PAST';
        case 'Active':   return event.statusCode === 1 || statusStr === 'ACTIVE' || statusStr === 'LIVE';
        case 'Cancelled':return statusStr === 'CANCELLED';
        default: return true;
      }
    });
  };

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
            // Added the new ticket-category API to the Promise.all array
            const [scanResponse, ticketsResponse, categoryScannedResponse] = await Promise.all([
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
              }),
              fetch(`${API_BASE_URL}/staff/ticket-category/scanned/${apiEvent.id}`, {
                headers: {
                  "Authorization": `Bearer ${userInfo.token}`,
                  "Accept": "application/json"
                }
              })
            ])

            let scannedCount = 0
            if (scanResponse.ok) {
              const scanJson = await scanResponse.json()
              scannedCount = typeof scanJson.data === 'number' ? scanJson.data : 0
            }

            let totalCapacity = 0
            let ticketTypes = {}
            
            if (ticketsResponse.ok) {
              const ticketsJson = await ticketsResponse.json()
              const allTickets = ticketsJson.data || ticketsJson.tickets || ticketsJson
              const eventTickets = Array.isArray(allTickets)
                ? allTickets.filter(t => t.event_id == apiEvent.id)
                : []

              totalCapacity = eventTickets.reduce((sum, t) => sum + (parseInt(t.original_qty) || 0), 0)

              eventTickets.forEach(ticket => {
                const typeName = ticket.type || 'General'
                if (!ticketTypes[typeName]) {
                  ticketTypes[typeName] = {
                    id: Object.keys(ticketTypes).length + 1,
                    name: typeName,
                    inclusions: ticket.inclusions,
                    checkedIn: 0, 
                    capacity: 0,
                    color: typeName.toUpperCase().includes('VIP') ? '#FFAA00' : '#00C2FF', 
                  }
                }
                ticketTypes[typeName].capacity += parseInt(ticket.original_qty) || 0
              })
            }

            if (categoryScannedResponse && categoryScannedResponse.ok) {
              const catScannedJson = await categoryScannedResponse.json()
              const scannedData = catScannedJson.data || []

              scannedData.forEach(scanned => {
                const typeName = scanned.type || 'General'
                if (ticketTypes[typeName]) {
                  
                  ticketTypes[typeName].checkedIn = scanned.count
                } else {
                  // Fallback: If a scanned ticket type somehow isn't in the main tickets array
                  ticketTypes[typeName] = {
                    id: Object.keys(ticketTypes).length + 1,
                    name: typeName,
                    checkedIn: scanned.count,
                    capacity: 0, 
                    color: '#00E5A0',
                  }
                }
              })
            }

            return {
              ...baseEvent,
              totalCheckedIn: scannedCount,
              totalCapacity: totalCapacity,
              categories: Object.values(ticketTypes)
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
              <Ionicons name="cloud-offline" size={16} color="#FFD5DB" />
              <View style={styles.offlineTextContainer}>
                <Text style={styles.offlineBannerTitle}>OFFLINE</Text>
                <Text style={styles.offlineBannerText}>Connect to the internet to get live attendance updates.</Text>
              </View>
            </View>
          )}

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#3D6080" />
            <Text style={styles.searchPlaceholder}>Search events…</Text>
          </View>

          {/* Standardized Merchant Tabs */}
          <View style={styles.tabsWrapper}>
            <ScrollView 
              ref={tabScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.tabsScroll}
              onScroll={(e) => {
                const x = e.nativeEvent.contentOffset.x
                const contentW = e.nativeEvent.contentSize.width
                const visibleW = e.nativeEvent.layoutMeasurement.width
                const maxScroll = contentW - visibleW
                const dotIndex = maxScroll > 0
                  ? Math.round((x / maxScroll) * (TAB_DOTS - 1))
                  : 0
                setTabScrollIndex(dotIndex)
              }}
              scrollEventThrottle={16}
            >
              {TABS.map((tab) => {
                const isActiveTab = activeTab === tab
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabItem, isActiveTab && styles.activeTabItem]}
                  >
                    <Text style={[styles.tabTextUI, isActiveTab && styles.activeTabTextUI]}>
                      {tab}
                    </Text>
                    {isActiveTab && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {/* Pagination dots */}
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
          </View>

          {/* Event cards */}
          {getFilteredEvents().map((ev) => {
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
                  <View style={[styles.statusPill, { backgroundColor: ev.statusColor + '15', borderColor: ev.statusColor + '30', borderWidth: 1 }]}>
                    <View style={[styles.statusDot, { backgroundColor: ev.statusColor }]} />
                    <Text style={[styles.statusText, { color: ev.statusColor }]}>{ev.status}</Text>
                  </View>
                  <View style={[
                    styles.accentTag,
                    { backgroundColor: 'rgba(5, 10, 20, 0.6)', borderColor: ev.accentColor + '40' }
                  ]}>
                    <Text style={[styles.accentTagText, { color: ev.accentColor }]}>
                      {pct}% CHECKED IN
                    </Text>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.cardInfoSection}>
                  <Text style={styles.eventCardName} numberOfLines={1}>{ev.name}</Text>
                  
                  <View style={[styles.metaRow, { flexWrap: 'wrap' }]}>
                    <View style={styles.metaItem}>
                      <Foundation name="marker" size={11} color="#00C2FF" />
                      <Text style={styles.eventCardVenue} numberOfLines={1}>{ev.venue}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Foundation name="calendar" size={11} color="#00C2FF" />
                      <Text style={styles.eventCardDate}>{ev.date}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Foundation name="clock" size={11} color="#00C2FF" />
                      <Text style={styles.eventCardDate}>{ev.time}</Text>
                    </View>
                  </View>

                  {/* Counts */}
                  <View style={styles.countRow}>
                    <Text style={styles.countHighlight}>{ev.totalCheckedIn.toLocaleString()}</Text>
                    <Text style={styles.countMuted}>/ {ev.totalCapacity.toLocaleString()} ATTENDEES</Text>
                  </View>

                  {/* Mini progress */}
                  <View style={styles.miniProgressTrack}>
                    <View style={[styles.miniProgressFill, { width: `${pct}%`, backgroundColor: ev.accentColor }]} />
                  </View>

                  {/* Category pills */}
                  <View style={styles.catPillRow}>
                    {ev.categories.slice(0, 3).map((c) => (
                      <View key={c.id} style={[styles.catPill, { backgroundColor: c.color + '15', borderColor: c.color + '30', borderWidth: 1 }]}>
                        <Text style={[styles.catPillText, { color: c.color }]}>{c.name}</Text>
                      </View>
                    ))}
                    {ev.categories.length > 3 && (
                      <View style={[styles.catPill, { backgroundColor: '#132035' }]}>
                        <Text style={styles.catPillText}>+{ev.categories.length - 3} MORE</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: '#0F1E30' }]}>
                  <Text style={[styles.cardFooterText, { color: ev.accentColor }]}>
                    VIEW ATTENDANCE REPORT ›
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

          {/* Edge-to-Edge Event Banner */}
          <View style={styles.banner}>
            <Image source={{ uri: event.image || 'https://via.placeholder.com/600x400' }} style={styles.bannerImage} />
            <View style={[styles.bannerOverlay, { backgroundColor: 'rgba(5, 10, 20, 0.7)' }]} />
            <View style={styles.bannerContent}>
              {event.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{(event.category).toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.eventTitle}>{event.name}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaItem}>
                  <Foundation name="marker" size={13} color="#00C2FF" />
                  <Text style={styles.heroMetaText} numberOfLines={1}>{event.venue}</Text>
                </View>
                <View style={styles.heroMetaItem}>
                  <Foundation name="calendar" size={13} color="#00C2FF" />
                  <Text style={styles.heroMetaText}>{event.date}</Text>
                </View>
                <View style={styles.heroMetaItem}>
                  <Foundation name="clock" size={13} color="#00C2FF" />
                  <Text style={styles.heroMetaText}>{event.time}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Main Counter Card */}
          <View style={[styles.mainCard, { shadowColor: event.accentColor }]}>
            <View style={styles.mainHeader}>
              <View>
                <Text style={styles.mainLabel}>LIVE ATTENDANCE</Text>
                <Text style={styles.mainCount}>
                  {event.totalCheckedIn.toLocaleString()}
                  <Text style={styles.mainCapacity}> / {event.totalCapacity.toLocaleString()}</Text>
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: event.statusColor + '15', borderColor: event.statusColor + '30', borderWidth: 1 }]}>
                <View style={[styles.statusDot, { backgroundColor: event.statusColor }]} />
                <Text style={[styles.statusText, { color: event.statusColor }]}>{event.status}</Text>
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
              <Text style={styles.percentText}>{overallPct}% CAPACITY REACHED</Text>
              <Text style={styles.remainingText}>
                {(event.totalCapacity - event.totalCheckedIn).toLocaleString()} REMAINING
              </Text>
            </View>
          </View>


          <Text style={styles.sectionTitle}>Ticket Tiers</Text>

          {/* Ticket Tiers */}
          {event.categories.map((cat) => {
            const percent = cat.capacity > 0
              ? (cat.checkedIn / cat.capacity) * 100 : 0
            
            const inclusionsText = cat.inclusions || 'Access to general admission area';

            return (
              <View key={cat.id} style={[styles.passCard, { borderColor: cat.color }]}>
                {/* Boarding Pass Top */}
                <View style={styles.passTop}>
                  <View style={styles.passHeader}>
                    <Text style={styles.passTitle}>{cat.name.toUpperCase()}</Text>
                    <Text style={[styles.catPercent, { color: cat.color }]}>
                      {Math.round(percent)}%
                    </Text>
                  </View>
                  <Text style={[styles.passType, { color: cat.color !== '#132035' ? cat.color : '#7E97B3' }]}>
                    {cat.checkedIn.toLocaleString()} CHECKED IN OF {cat.capacity.toLocaleString()}
                  </Text>

                  {/* Inclusions List */}
                  <View style={styles.passInclusionsRow}>
                    <Foundation name="check" size={12} color="#4A8AAF" style={{ marginTop: 2 }} />
                    <Text style={styles.passInclusionsText}>{inclusionsText}</Text>
                  </View>
                </View>

                {/* Perforation Divider */}
                <View style={styles.passDividerRow}>
                  <View style={[styles.notchLeft, { borderColor: cat.color }]} />
                  <View style={styles.dashedLine} />
                  <View style={[styles.notchRight, { borderColor: cat.color }]} />
                </View>

                {/* Boarding Pass Bottom (Analytics) */}
                <View style={styles.passBottom}>
                  <View style={styles.catProgressBg}>
                    <View
                      style={[
                        styles.catProgressBar,
                        { width: `${percent}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )
          })}

          {/* Switch event pill */}
          <TouchableOpacity style={styles.switchBtn} onPress={onBack}>
            <Ionicons name="swap-horizontal" size={16} color="#00C2FF" />
            <Text style={styles.switchBtnText}>SWITCH EVENT</Text>
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
}const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050A14' },

  bgOrb1: {
    position: 'absolute', width: 350, height: 350, borderRadius: 175,
    backgroundColor: '#00C2FF', top: -100, right: -150, opacity: 0.04,
  },
  bgOrb2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#FF4D6A', bottom: -50, left: -100, opacity: 0.02,
  },

  safeArea:      { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },

  pageHeadRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 24 },
  pageHeadTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  pageHeadSub:   { color: '#4A8AAF', fontSize: 13, fontWeight: '500' },
  pulseOrb: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#00E5A0',
    shadowColor: '#00E5A0', shadowOpacity: 0.9, shadowRadius: 8, elevation: 6,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1623',
    borderRadius: 14, borderWidth: 1, borderColor: '#132035',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, gap: 12,
  },
  searchPlaceholder: { color: '#4A8AAF', fontSize: 13, fontWeight: '600' },

  tabsWrapper: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabsScroll: {
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

  eventCard: {
    backgroundColor: '#0B1623', borderRadius: 20, borderWidth: 1,
    borderColor: '#132035', marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  eventCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14, paddingBottom: 10,
  },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  statusDot:  { width: 4, height: 4, borderRadius: 2 },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  
  accentTag: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  accentTagText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  cardInfoSection:   { paddingHorizontal: 14, paddingBottom: 14 },
  eventCardName:     { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  metaRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  metaItem:          { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventCardVenue:    { color: '#7E97B3', fontSize: 10, fontWeight: '600' },
  eventCardDate:     { color: '#7E97B3', fontSize: 10, fontWeight: '600' },

  countRow:        { flexDirection: 'row', alignItems: 'baseline', marginTop: 12, marginBottom: 8, gap: 6 },
  countHighlight:  { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  countMuted:      { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  miniProgressTrack: { height: 6, backgroundColor: '#0F1E30', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  miniProgressFill:  { height: '100%', borderRadius: 3 },

  catPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catPill:    { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  catPillText:{ color: '#FFFFFF', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  cardFooter:     { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'flex-end' },
  cardFooterText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  mainCard: {
    backgroundColor: '#0B1623', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#132035', marginBottom: 20,
    elevation: 10, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }
  },
  mainHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  mainLabel:    { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  mainCount:    { color: '#FFFFFF', fontSize: 40, fontWeight: '800', marginTop: 4 },
  mainCapacity: { color: '#3D6080', fontSize: 20, fontWeight: '600' },

  progressContainer: { height: 12, backgroundColor: '#132035', borderRadius: 6, overflow: 'hidden', marginVertical: 12 },
  progressBar:       { height: '100%', borderRadius: 6 },
  progressGlow:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 },

  percentRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  percentText:    { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  remainingText:  { color: '#3D6080', fontSize: 11, fontWeight: '800' },

  // Event Banner
  banner: { height: height * 0.28, marginHorizontal: -20, marginBottom: 20, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject },
  bannerContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  categoryTag: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginBottom: 8 },
  categoryTagText: { color: '#050A14', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  eventTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 12 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 20 },

  catCard: {
    backgroundColor: '#0B1623', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#132035', marginBottom: 16,
  },
  catInfo:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  catIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  catName:    { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 2 },
  catMeta:    { color: '#2E4A62', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  catPercent: { fontSize: 20, fontWeight: '900' },

  // Modern Boarding Pass Style (Clean/Minimal)
  passCard: {
    marginHorizontal: 0, backgroundColor: 'rgba(11, 22, 35, 0.5)', borderRadius: 16, marginBottom: 16, 
    borderWidth: 1.5, borderColor: '#132035', overflow: 'hidden'
  },
  passTop: { padding: 16, paddingBottom: 14 },
  passHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  passTitle: { flexShrink: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  passType: { fontSize: 11, fontWeight: '700', marginBottom: 12 },
  
  passInclusionsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  passInclusionsText: { flex: 1, color: '#A0AEC0', fontSize: 11, lineHeight: 16 },

  passDividerRow: { flexDirection: 'row', alignItems: 'center', height: 16, position: 'relative', marginVertical: 4 },
  notchLeft: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#050A14', position: 'absolute', left: -9, zIndex: 2, borderWidth: 1, borderColor: '#132035' },
  notchRight: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#050A14', position: 'absolute', right: -9, zIndex: 2, borderWidth: 1, borderColor: '#132035' },
  dashedLine: { flex: 1, height: 1, marginHorizontal: 16, borderTopWidth: 1, borderColor: '#1A2A44', borderStyle: 'dashed' },

  passBottom: { paddingHorizontal: 16, paddingVertical: 12 },

  catProgressBg:  { height: 6, backgroundColor: '#132035', borderRadius: 3, overflow: 'hidden' },
  catProgressBar: { height: '100%', borderRadius: 3 },

  switchBtn: {
    flexDirection: 'row', gap: 10, alignSelf: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#132035',
    paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0B1623', marginTop: 20, alignItems: 'center'
  },
  switchBtnText: { color: '#00C2FF', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#4A8AAF', marginTop: 15, fontSize: 12, fontWeight: '600' },
  errorText: {
    fontSize: 14,
    color: '#FF4D6A',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  noDataText: { color: '#4A8AAF', fontSize: 14 },
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
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    marginBottom: 20, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, backgroundColor: '#3B1118', borderWidth: 1, borderColor: '#6D2430',
  },
  offlineTextContainer: { marginLeft: 12 },
  offlineBannerTitle: { color: '#FFD5DB', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  offlineBannerText: { color: '#FFB7C2', fontSize: 12 },
})
