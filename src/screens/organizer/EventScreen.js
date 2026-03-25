import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, StatusBar, ScrollView, Animated
} from 'react-native'
import React, { useEffect, useRef, useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../../context/AuthContext'
import { Alert } from 'react-native'

const { width } = Dimensions.get('window')

const EVENTS = [
  {
    id: 'e1',
    title: 'MediaOne Summer Fest 2025',
    venue: 'Grand Plaza Arena',
    schedule: 'Tonight, 7:00 PM',
    status: 'GATES OPEN',
    statusColor: '#00E5A0',
    accentColor: '#00C2FF',
    totalTickets: 2000,
    scanned: 1360,
    categories: [
      { label: 'VIP ACCESS',    value: 420, pct: 0.85, color: '#00C2FF', note: null },
      { label: 'GEN ADMISSION', value: 940, pct: 0.62, color: '#00E5A0', note: null },
      { label: 'INVALID SCANS', value: 12,  pct: null,  color: '#FF4D6A', note: 'Action Required' },
      { label: 'REMAINING',     value: 640, pct: null,  color: '#FFB84D', note: 'Expected' },
    ],
  },
  {
    id: 'e2',
    title: 'Neon Horizon Music Festival',
    venue: 'Sunken Gardens Amphitheater',
    schedule: 'Sat, Apr 19 · 8:00 PM',
    status: 'UPCOMING',
    statusColor: '#FFB84D',
    accentColor: '#A855F7',
    totalTickets: 500,
    scanned: 0,
    categories: [
      { label: 'VIP ACCESS',    value: 98,  pct: 0.98, color: '#FFB84D', note: null },
      { label: 'GEN ADMISSION', value: 189, pct: 0.63, color: '#A855F7', note: null },
      { label: 'INVALID SCANS', value: 0,   pct: null,  color: '#FF4D6A', note: 'None Yet' },
      { label: 'REMAINING',     value: 213, pct: null,  color: '#00C2FF', note: 'Not Started' },
    ],
  },
  {
    id: 'e3',
    title: 'CDO Tech Summit 2026',
    venue: 'Xavier University Covered Court',
    schedule: 'Fri, Jun 12 · 9:00 AM',
    status: 'UPCOMING',
    statusColor: '#FFB84D',
    accentColor: '#00E5A0',
    totalTickets: 400,
    scanned: 210,
    categories: [
      { label: 'SPEAKER PASS',  value: 32,  pct: 0.64, color: '#00E5A0', note: null },
      { label: 'PRO ATTENDEE',  value: 140, pct: 0.70, color: '#00C2FF', note: null },
      { label: 'INVALID SCANS', value: 3,   pct: null,  color: '#FF4D6A', note: 'Action Required' },
      { label: 'REMAINING',     value: 190, pct: null,  color: '#FFB84D', note: 'Expected' },
    ],
  },
  {
    id: 'e4',
    title: 'Lechon & Beats Food Fest',
    venue: 'Pueblo de Oro Grounds',
    schedule: 'Sun, May 4 · 11:00 AM',
    status: 'SELLING',
    statusColor: '#FF9500',
    accentColor: '#FF6B35',
    totalTickets: 300,
    scanned: 74,
    categories: [
      { label: 'EARLY BIRD',    value: 74,  pct: 0.74, color: '#FF6B35', note: null },
      { label: 'REGULAR',       value: 0,   pct: 0.00, color: '#FFB84D', note: null },
      { label: 'INVALID SCANS', value: 1,   pct: null,  color: '#FF4D6A', note: 'Action Required' },
      { label: 'REMAINING',     value: 226, pct: null,  color: '#00E5A0', note: 'Available' },
    ],
  },
]
const BgDecor = () => (
  <>
    <View style={styles.bgOrb1} />
    <View style={styles.bgOrb2} />
    {[...Array(5)].map((_, i) => (
      <View key={i} style={[styles.gridLine, { top: (width * 0.4) * i }]} />
    ))}
  </>
)

function EventSelectionView({ onSelect, handleLogout, navigation }) {
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <View style={styles.bgOrb1}/>
      <View style={styles.bgOrb2}/>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.toggleDrawer?.()} style={styles.menuBtn}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 14 }]} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              <Text style={styles.headerMedia}>MediaOne</Text>
              <Text style={styles.headerTix}>Tix</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.profileBtn}>
            <View style={styles.profileAvatar} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Page heading */}
          <View style={styles.pageHeadRow}>
            <View>
              <Text style={styles.pageHeadTitle}>SELECT EVENT</Text>
              <Text style={styles.pageHeadSub}>Choose an event to open its live tracker</Text>
            </View>
            <Animated.View
              style={[styles.pulseOrb, { transform: [{ scale: pulseAnim }] }]}
            />
          </View>

          <View style={styles.searchBar}>
            <Text style={styles.searchIconText}>⌕</Text>
            <Text style={styles.searchPlaceholder}>Search events…</Text>
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {['ALL EVENTS', 'LIVE', 'UPCOMING', 'PAST'].map((f, i) => (
              <View key={f} style={[styles.chip, i === 0 && styles.chipActive]}>
                <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{f}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Event cards */}
          {EVENTS.map((ev) => {
            const pct = ev.totalTickets > 0
              ? Math.round((ev.scanned / ev.totalTickets) * 100) : 0
            const isLive = ev.status === 'GATES OPEN'

            return (
              <TouchableOpacity
                key={ev.id}
                style={[
                  styles.eventCard,
                  { borderColor: isLive ? ev.accentColor + '55' : '#132035' },
                ]}
                onPress={() => onSelect(ev)}
                activeOpacity={0.8}
              >
                {/* Top row */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.statusPill, { backgroundColor: ev.statusColor + '18' }]}>
                    {isLive && <View style={[styles.statusDot, { backgroundColor: ev.statusColor }]} />}
                    <Text style={[styles.statusText, { color: ev.statusColor }]}>{ev.status}</Text>
                  </View>
                  <View style={[
                    styles.accentTag,
                    { backgroundColor: ev.accentColor + '18', borderColor: ev.accentColor + '33' },
                  ]}>
                    <Text style={[styles.accentTagText, { color: ev.accentColor }]}>
                      {pct}% SCANNED
                    </Text>
                  </View>
                </View>

                {/* Info */}
                <Text style={styles.cardTitle}>{ev.title}</Text>
                <Text style={styles.cardVenue}>{ev.venue}</Text>
                <Text style={[styles.cardSchedule, { color: ev.accentColor }]}>{ev.schedule}</Text>

                {/* Mini progress */}
                <View style={styles.miniRow}>
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: `${pct}%`, backgroundColor: ev.accentColor }]} />
                  </View>
                  <Text style={styles.miniCount}>{ev.scanned.toLocaleString()} / {ev.totalTickets.toLocaleString()}</Text>
                </View>

                {/* Footer CTA */}
                <View style={[styles.cardFooter, { borderTopColor: isLive ? ev.accentColor + '22' : '#0F1E30' }]}>
                  <Text style={[styles.cardFooterText, { color: ev.accentColor }]}>
                    VIEW TICKET REPORT  ›
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}


function TicketReportView({ event, onBack, handleLogout, navigation }) {
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const pct = event.totalTickets > 0
    ? Math.round((event.scanned / event.totalTickets) * 100) : 0

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <BgDecor />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={[styles.backArrow, { color: event.accentColor }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              <Text style={styles.headerMedia}>MediaOne</Text>
              <Text style={styles.headerTix}>Tix</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.profileBtn}>
            <View style={styles.profileAvatar} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Event Details Box */}
          <View style={[styles.eventHeroBox, { borderColor: event.accentColor + '33' }]}>
            <View style={styles.liveIndicator}>
              <Animated.View
                style={[
                  styles.liveDot,
                  {
                    backgroundColor: event.statusColor,
                    shadowColor: event.statusColor,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Text style={[styles.liveText, { color: event.statusColor }]}>{event.status}</Text>
            </View>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventSub}>{event.venue} • {event.schedule}</Text>
          </View>

          {/* Tracker Ring */}
          <View style={styles.trackerContainer}>
            <View style={[styles.trackerRingBg, { shadowColor: event.accentColor }]}>
              <View
                style={[
                  styles.trackerRingFill,
                  { borderColor: event.accentColor, borderTopColor: '#132035' },
                ]}
              >
                <View style={styles.trackerCore}>
                  <Text style={styles.trackerPercent}>{pct}%</Text>
                  <Text style={[styles.trackerLabel, { color: event.accentColor }]}>SCANNED</Text>
                  <View style={styles.trackerDivider} />
                  <Text style={styles.trackerCounts}>
                    <Text style={styles.trackerCountHighlight}>{event.scanned.toLocaleString()}</Text>
                    <Text style={styles.trackerCountMuted}> / {event.totalTickets.toLocaleString()}</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <Text style={styles.sectionTitle}>Breakdown</Text>
          <View style={styles.statsGrid}>
            {event.categories.map((cat, i) => (
              <View key={i} style={[styles.statCard, { borderColor: cat.color + '44' }]}>
                <Text style={styles.statLabel}>{cat.label}</Text>
                <Text style={[styles.statValue, { color: cat.color }]}>{cat.value}</Text>
                {cat.pct !== null ? (
                  <>
                    <View style={styles.statProgressBg}>
                      <View
                        style={[
                          styles.statProgressFill,
                          { width: `${Math.round(cat.pct * 100)}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.statSub}>{Math.round(cat.pct * 100)}% Capacity</Text>
                  </>
                ) : (
                  <Text style={[styles.statSub, { color: cat.color, marginTop: 12 }]}>{cat.note}</Text>
                )}
              </View>
            ))}
          </View>

          {/* Switch event */}
          <TouchableOpacity style={styles.switchBtn} onPress={onBack}>
            <Text style={styles.switchBtnText}>⇄  SWITCH EVENT</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

export default function EventScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [selectedEvent, setSelectedEvent] = useState(null)

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Logout',
          onPress: () => {
            logout();
          },
          style: 'destructive'
        }
      ]
    )
  }

  if (!selectedEvent) {
    return <EventSelectionView onSelect={setSelectedEvent} handleLogout={handleLogout} navigation={navigation} />
  }
  return <TicketReportView event={selectedEvent} onBack={() => setSelectedEvent(null)} handleLogout={handleLogout} navigation={navigation} />
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050A14' },

  bgOrb1: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: '#00C2FF', top: -150, left: -200, opacity: 0.03,
  },
  bgOrb2: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#FF4D6A', bottom: -50, right: -150, opacity: 0.02,
  },
  gridLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  safeArea:      { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20,
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center' },
  backArrow:   { fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 20 },
  headerMedia: { color: '#FFFFFF', fontWeight: '600' },
  headerTix: { color: '#00C2FF', fontWeight: '800' },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', gap: 4 },
  menuLine: { width: 18, height: 1.5, backgroundColor: '#4A8AAF', borderRadius: 1 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#132035', padding: 2 },
  profileAvatar: { flex: 1, borderRadius: 16, backgroundColor: '#00C2FF', opacity: 0.5 },

  // Selection heading
  pageHeadRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageHeadTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  pageHeadSub:   { color: '#4A8AAF', fontSize: 13, fontWeight: '500' },
  pulseOrb: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#00E5A0',
    shadowColor: '#00E5A0', shadowOpacity: 0.9, shadowRadius: 8, elevation: 6,
  },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1623',
    borderRadius: 14, borderWidth: 1, borderColor: '#132035',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, gap: 10,
  },
  searchIconText:    { color: '#4A8AAF', fontSize: 18 },
  searchPlaceholder: { color: '#2A4A60', fontSize: 14, fontWeight: '500' },

  // Chips
  chipsScroll:    { marginBottom: 20 },
  chip:           { borderRadius: 20, borderWidth: 1, borderColor: '#132035', paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, backgroundColor: '#0B1623' },
  chipActive:     { backgroundColor: '#00C2FF', borderColor: '#00C2FF' },
  chipText:       { color: '#4A8AAF', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  chipTextActive: { color: '#050A14' },

  // Event card (selection)
  eventCard: {
    backgroundColor: '#0B1623', borderRadius: 20, borderWidth: 1,
    marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  accentTag:  { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  accentTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  cardTitle:    { color: '#FFFFFF', fontSize: 17, fontWeight: '800', paddingHorizontal: 16, marginBottom: 4, letterSpacing: -0.3 },
  cardVenue:    { color: '#4A8AAF', fontSize: 12, fontWeight: '500', paddingHorizontal: 16, marginBottom: 3 },
  cardSchedule: { fontSize: 12, fontWeight: '700', paddingHorizontal: 16, marginBottom: 14, letterSpacing: 0.3 },

  miniRow:   { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniTrack: { flex: 1, height: 4, backgroundColor: '#0F1E30', borderRadius: 2, overflow: 'hidden' },
  miniFill:  { height: '100%', borderRadius: 2 },
  miniCount: { color: '#2A4A60', fontSize: 11, fontWeight: '600' },

  cardFooter:     { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, marginTop: 14 },
  cardFooterText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },

  // Report hero box
  eventHeroBox: {
    backgroundColor: '#0B1623', borderRadius: 24, padding: 24, borderWidth: 1, marginBottom: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15,
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  liveDot:       { width: 8, height: 8, borderRadius: 4, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  liveText:      { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  eventTitle:    { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  eventSub:      { color: '#4A8AAF', fontSize: 13, fontWeight: '500' },

  // Tracker ring
  trackerContainer: { alignItems: 'center', marginVertical: 20 },
  trackerRingBg: {
    width: width * 0.65, height: width * 0.65, borderRadius: (width * 0.65) / 2,
    backgroundColor: '#050A14', borderWidth: 2, borderColor: '#132035',
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10,
  },
  trackerRingFill: {
    width: '90%', height: '90%', borderRadius: 1000, backgroundColor: '#0B1623',
    borderWidth: 8, alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  trackerCore: {
    width: '90%', height: '90%', borderRadius: 1000,
    backgroundColor: '#0B1623', alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  trackerPercent:        { color: '#FFFFFF', fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  trackerLabel:          { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: -4 },
  trackerDivider:        { width: 40, height: 2, backgroundColor: '#132035', marginVertical: 12 },
  trackerCounts:         { flexDirection: 'row', alignItems: 'baseline' },
  trackerCountHighlight: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  trackerCountMuted:     { color: '#4A8AAF', fontSize: 13, fontWeight: '500' },

  // Stats grid
  sectionTitle:     { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1, marginTop: 10, marginBottom: 16 },
  statsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 30 },
  statCard:         { width: (width - 54) / 2, backgroundColor: '#0B1623', borderRadius: 20, padding: 16, borderWidth: 1 },
  statLabel:        { color: '#4A8AAF', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  statValue:        { fontSize: 28, fontWeight: '800', letterSpacing: -1, marginBottom: 12 },
  statProgressBg:   { height: 4, backgroundColor: '#132035', borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  statProgressFill: { height: '100%', borderRadius: 2 },
  statSub:          { color: '#3D6080', fontSize: 11, fontWeight: '600' },


  // Switch event
  switchBtn: {
    alignSelf: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#132035',
    paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#0B1623',
  },
  switchBtnText: { color: '#4A8AAF', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
})