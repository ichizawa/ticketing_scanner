import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, ScrollView, Animated } from 'react-native'
import React, { useEffect, useRef, useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../../context/AuthContext'
import Header from '../../components/Header'; 


const { width } = Dimensions.get('window')

export default function EventScreen({ navigation }) {
  const { logout } = useContext(AuthContext);

  const [selectedEvent, setSelectedEvent] = useState(null);

  // Pulse animation (for selection view header)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
        { label: 'VIP ACCESS', value: 420, pct: 0.85, color: '#00C2FF', note: null },
        { label: 'GEN ADMISSION', value: 940, pct: 0.62, color: '#00E5A0', note: null },
        { label: 'INVALID SCANS', value: 12, pct: null, color: '#FF4D6A', note: 'Action Required' },
        { label: 'REMAINING', value: 640, pct: null, color: '#FFB84D', note: 'Expected' },
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
        { label: 'VIP ACCESS', value: 98, pct: 0.98, color: '#FFB84D', note: null },
        { label: 'GEN ADMISSION', value: 189, pct: 0.63, color: '#A855F7', note: null },
        { label: 'INVALID SCANS', value: 0, pct: null, color: '#FF4D6A', note: 'None Yet' },
        { label: 'REMAINING', value: 213, pct: null, color: '#00C2FF', note: 'Not Started' },
      ],
    },
  ];

  const handleLogout = () => logout();


  // ---------------------------------------
  // Ticket Report Screen (FULL PAGE)
  // ---------------------------------------
  function TicketReportView({ event, onBack }) {
    const pct = event.totalTickets > 0
      ? Math.round((event.scanned / event.totalTickets) * 100)
      : 0;

    return (
      <View style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <Header navigation={navigation} onBack={onBack} />

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Hero Box */}
            <View style={styles.eventHeroBox}>
              <View style={styles.liveIndicator}>
                <View style={[styles.liveDot, { backgroundColor: event.statusColor }]} />
                <Text style={[styles.liveText, { color: event.statusColor }]}>
                  {event.status}
                </Text>
              </View>

              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventSub}>{event.venue}</Text>
              <Text style={[styles.eventSub, { marginTop: 4 }]}>{event.schedule}</Text>

              {/* Tracker */}
              <View style={styles.trackerContainer}>
                <View style={styles.trackerRingBg}>
                  <View style={[styles.trackerRingFill, { borderColor: event.accentColor }]}>
                    <View style={styles.trackerCore}>
                      <Text style={styles.trackerPercent}>{pct}%</Text>
                      <Text style={styles.trackerLabel}>SCANNED</Text>
                      <View style={styles.trackerDivider} />
                      <View style={styles.trackerCounts}>
                        <Text style={styles.trackerCountHighlight}>{event.scanned}</Text>
                        <Text style={styles.trackerCountMuted}> / {event.totalTickets}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Stats Grid */}
            <Text style={styles.sectionTitle}>SCAN BREAKDOWN</Text>

            <View style={styles.statsGrid}>
              {event.categories.map((cat) => (
                <View
                  key={cat.label}
                  style={[
                    styles.statCard,
                    { borderColor: cat.color + '33' }
                  ]}
                >
                  <Text style={styles.statLabel}>{cat.label}</Text>

                  <Text style={[styles.statValue, { color: cat.color }]}>
                    {cat.value}
                  </Text>

                  {cat.pct !== null && (
                    <View style={styles.statProgressBg}>
                      <View
                        style={[
                          styles.statProgressFill,
                          { width: `${cat.pct * 100}%`, backgroundColor: cat.color }
                        ]}
                      />
                    </View>
                  )}

                  {cat.note && (
                    <Text style={styles.statSub}>{cat.note}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Switch event */}
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={onBack}
            >
              <Text style={styles.switchBtnText}>‹   SWITCH EVENT</Text>
            </TouchableOpacity>

            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ---------------------------------------
  // Main View Switch
  // ---------------------------------------
  if (selectedEvent) {
    return (
      <TicketReportView
        event={selectedEvent}
        onBack={() => setSelectedEvent(null)}
      />
    );
  }


  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      <SafeAreaView style={styles.safeArea}>

        <Header navigation={navigation} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Page Heading */}
          <View style={styles.pageHeadRow}>
            <View>
              <Text style={styles.pageHeadTitle}>SELECT EVENT</Text>
              <Text style={styles.pageHeadSub}>Choose an event to open its live tracker</Text>
            </View>

            <Animated.View
              style={[styles.pulseOrb, { transform: [{ scale: pulseAnim }] }]}
            />
          </View>

          {/* Event Cards */}
          {EVENTS.map((ev) => {
            const pct = Math.round((ev.scanned / ev.totalTickets) * 100);
            const isLive = ev.status === 'GATES OPEN';

            return (
              <TouchableOpacity
                key={ev.id}
                style={[
                  styles.eventCard,
                  { borderColor: isLive ? ev.accentColor + '55' : '#132035' }
                ]}
                onPress={() => setSelectedEvent(ev)}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.statusPill, { backgroundColor: ev.statusColor + '18' }]}>
                    {isLive && <View style={[styles.statusDot, { backgroundColor: ev.statusColor }]} />}
                    <Text style={[styles.statusText, { color: ev.statusColor }]}>{ev.status}</Text>
                  </View>

                  <View style={[
                    styles.accentTag,
                    { backgroundColor: ev.accentColor + '18', borderColor: ev.accentColor + '33' }
                  ]}>
                    <Text style={[styles.accentTagText, { color: ev.accentColor }]}>
                      {pct}% SCANNED
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{ev.title}</Text>
                <Text style={styles.cardVenue}>{ev.venue}</Text>
                <Text style={[styles.cardSchedule, { color: ev.accentColor }]}>
                  {ev.schedule}
                </Text>

                <View style={styles.miniRow}>
                  <View style={styles.miniTrack}>
                    <View
                      style={[
                        styles.miniFill,
                        { width: `${pct}%`, backgroundColor: ev.accentColor }
                      ]}
                    />
                  </View>
                  <Text style={styles.miniCount}>
                    {ev.scanned.toLocaleString()} / {ev.totalTickets.toLocaleString()}
                  </Text>
                </View>

                <View style={[
                  styles.cardFooter,
                  { borderTopColor: isLive ? ev.accentColor + '22' : '#0F1E30' }
                ]}>
                  <Text style={[styles.cardFooterText, { color: ev.accentColor }]}>
                    VIEW TICKET REPORT  ›
                  </Text>
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

  bgOrb1: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: '#00C2FF', top: -150, left: -200, opacity: 0.03,
  },
  bgOrb2: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#FF4D6A', bottom: -50, right: -150, opacity: 0.02,
  },
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
  cardSchedule: { fontSize: 12, fontWeight: '700', paddingHorizontal: 16 },

  miniRow: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniTrack: { flex: 1, height: 4, backgroundColor: '#0F1E30', borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 2 },
  miniCount: { color: '#2A4A60', fontSize: 11 },

  cardFooter: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, marginTop: 14 },
  cardFooterText: { fontSize: 12, fontWeight: '800' },

  eventHeroBox: {
    backgroundColor: '#0B1623', borderRadius: 24, padding: 24,
    borderWidth: 1, marginBottom: 30,
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 10, fontWeight: '800' },

  eventTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 8 },
  eventSub: { color: '#4A8AAF', fontSize: 13 },

  trackerContainer: { alignItems: 'center', marginVertical: 20 },
  trackerRingBg: {
    width: width * 0.65, height: width * 0.65, borderRadius: width * 0.325,
    backgroundColor: '#050A14', borderWidth: 2, borderColor: '#132035',
    alignItems: 'center', justifyContent: 'center'
  },
  trackerRingFill: {
    width: '90%', height: '90%', borderRadius: 999, backgroundColor: '#0B1623',
    borderWidth: 8, alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '45deg' }]
  },
  trackerCore: {
    width: '90%', height: '90%', borderRadius: 999,
    backgroundColor: '#0B1623', alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '-45deg' }]
  },
  trackerPercent: { color: '#FFFFFF', fontSize: 48, fontWeight: '900' },
  trackerLabel: { color: '#4A8AAF', fontSize: 11, fontWeight: '800' },
  trackerDivider: { width: 40, height: 2, backgroundColor: '#132035', marginVertical: 12 },
  trackerCounts: { flexDirection: 'row' },
  trackerCountHighlight: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  trackerCountMuted: { color: '#4A8AAF', fontSize: 13 },

  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  statCard: {
    width: (width - 54) / 2, backgroundColor: '#0B1623',
    borderRadius: 20, padding: 16, borderWidth: 1
  },
  statLabel: { color: '#4A8AAF', fontSize: 9, fontWeight: '800', marginBottom: 6 },
  statValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 12 },

  statProgressBg: { height: 4, backgroundColor: '#132035', borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  statProgressFill: { height: '100%', borderRadius: 2 },

  statSub: { color: '#3D6080', fontSize: 11, fontWeight: '600' },

  switchBtn: {
    alignSelf: 'center', borderRadius: 20, borderWidth: 1,
    borderColor: '#132035', paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: '#0B1623',
  },
  switchBtnText: { color: '#4A8AAF', fontSize: 12, fontWeight: '800' },
});