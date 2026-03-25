import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, StatusBar, ScrollView, Animated
} from 'react-native'
import React, { useRef, useEffect, useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../../context/AuthContext'
import { Alert } from 'react-native'

const { width } = Dimensions.get('window')


const EVENTS = [
  {
    id: 'e1',
    name: 'MediaOne Summer Fest 2025',
    venue: 'Grand Plaza Arena',
    date: 'Tonight, 7:00 PM',
    status: 'LIVE',
    statusColor: '#00E5A0',
    accentColor: '#00C2FF',
    totalCheckedIn: 842,
    totalCapacity: 1200,
    categories: [
      { id: 1, name: 'VVIP Backstage',    checkedIn: 45,  capacity: 50,  color: '#FFD700', icon: '👑' },
      { id: 2, name: 'VIP — GA Floor',    checkedIn: 210, capacity: 300, color: '#00C2FF', icon: '💎' },
      { id: 3, name: 'Early Bird',         checkedIn: 450, capacity: 500, color: '#00E5A0', icon: '🐣' },
      { id: 4, name: 'General Admission', checkedIn: 137, capacity: 350, color: '#FF4D6A', icon: '🎫' },
    ],
  },
  {
    id: 'e2',
    name: 'Neon Horizon Music Festival',
    venue: 'Sunken Gardens Amphitheater',
    date: 'Sat, Apr 19 · 8:00 PM',
    status: 'UPCOMING',
    statusColor: '#FFB84D',
    accentColor: '#A855F7',
    totalCheckedIn: 0,
    totalCapacity: 500,
    categories: [
      { id: 1, name: 'VIP Access',        checkedIn: 0,  capacity: 100, color: '#FFD700', icon: '👑' },
      { id: 2, name: 'General Admission', checkedIn: 0,  capacity: 300, color: '#A855F7', icon: '🎫' },
      { id: 3, name: 'Student Pass',      checkedIn: 0,  capacity: 100, color: '#00E5A0', icon: '🎓' },
    ],
  },
  {
    id: 'e3',
    name: 'CDO Tech Summit 2026',
    venue: 'Xavier University Covered Court',
    date: 'Fri, Jun 12 · 9:00 AM',
    status: 'UPCOMING',
    statusColor: '#FFB84D',
    accentColor: '#00E5A0',
    totalCheckedIn: 97,
    totalCapacity: 400,
    categories: [
      { id: 1, name: 'Speaker Pass',  checkedIn: 22,  capacity: 50,  color: '#00E5A0', icon: '🎤' },
      { id: 2, name: 'Pro Attendee',  checkedIn: 65,  capacity: 200, color: '#00C2FF', icon: '💼' },
      { id: 3, name: 'Student Dev',   checkedIn: 10,  capacity: 150, color: '#FF4D6A', icon: '🧑‍💻' },
    ],
  },
  {
    id: 'e4',
    name: 'Lechon & Beats Food Fest',
    venue: 'Pueblo de Oro Grounds',
    date: 'Sun, May 4 · 11:00 AM',
    status: 'SELLING',
    statusColor: '#FF9500',
    accentColor: '#FF6B35',
    totalCheckedIn: 0,
    totalCapacity: 300,
    categories: [
      { id: 1, name: 'Early Bird', checkedIn: 0, capacity: 100, color: '#FF6B35', icon: '🐦' },
      { id: 2, name: 'Regular',    checkedIn: 0, capacity: 150, color: '#FFB84D', icon: '🎟️' },
      { id: 3, name: 'Group of 5', checkedIn: 0, capacity: 50,  color: '#00E5A0', icon: '👥' },
    ],
  },
]

const BgOrbs = () => (
  <>
    <View style={styles.bgOrb1} />
    <View style={styles.bgOrb2} />
  </>
)


function EventSelectionView({ onSelect, handleLogout, navigation }) {
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <BgOrbs />

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

          <View style={styles.pageHeadRow}>
            <View>
              <Text style={styles.pageHeadTitle}>All Events</Text>
              <Text style={styles.pageHeadSub}>Tap an event to view attendee analytics</Text>
            </View>
            <Animated.View style={[styles.pulseOrb, { transform: [{ scale: pulseAnim }] }]} />
          </View>

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
          {EVENTS.map((ev) => {
            const pct = ev.totalCapacity > 0
              ? Math.round((ev.totalCheckedIn / ev.totalCapacity) * 100) : 0
            const isLive = ev.status === 'LIVE'

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
                  {ev.categories.map((c) => (
                    <View key={c.id} style={[styles.catPill, { backgroundColor: c.color + '18' }]}>
                      <Text style={styles.catPillText}>{c.icon} {c.name}</Text>
                    </View>
                  ))}
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
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

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 24 },
  headerTitle: { fontSize: 20 },
  headerMedia: { color: '#FFFFFF', fontWeight: '600' },
  headerTix: { color: '#00C2FF', fontWeight: '800' },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', gap: 4 },
  menuLine: { width: 18, height: 1.5, backgroundColor: '#4A8AAF', borderRadius: 1 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#132035', padding: 2 },
  profileAvatar: { flex: 1, borderRadius: 16, backgroundColor: '#00C2FF', opacity: 0.5 },
  dummySpace:       { width: 40 },

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
})