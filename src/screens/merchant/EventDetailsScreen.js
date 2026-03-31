import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator, ImageBackground, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Foundation } from '@expo/vector-icons';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const { width, height } = Dimensions.get('window');
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

const getStatusColor = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'LIVE' || s === 'ACTIVE' || s === 'ON LIVE') return '#00E5A0';
  if (s === 'COMPLETED' || s === 'DONE LIVE' || s === 'PAST') return '#3D6080';
  return '#00C2FF';
};

const TIER_COLORS = ['#a7d2fa', '#FFD700', '#E5E4E2', '#B87333', '#00E5A0', '#00C2FF'];

const BgDecor = () => (
  <>
    <View style={styles.bgOrb1} />
    <View style={styles.bgOrb2} />
    {[...Array(5)].map((_, i) => (
      <View key={i} style={[styles.gridLine, { top: width * 0.4 * i }]} />
    ))}
  </>
);

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;
  const { userInfo, logout } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);

  const statusStr = String(event.status || '').toUpperCase();
  const statusColor = getStatusColor(statusStr);

  const dynamicTotal    = tickets.reduce((s, t) => s + (parseInt(t.original_qty) || 0), 0);
  const dynamicRemaining = tickets.reduce((s, t) => s + (parseInt(t.quantity)     || 0), 0);
  const dynamicSold     = Math.max(0, dynamicTotal - dynamicRemaining);
  const pct             = dynamicTotal > 0 ? Math.round((dynamicSold / dynamicTotal) * 100) : 0;

  useEffect(() => { fetchEventTickets(); }, []);

  const fetchEventTickets = async () => {
    try {
      if (!userInfo?.token) return;
      const res = await fetch(`${API_BASE_URL}/merchant/tickets`, {
        headers: { Authorization: `Bearer ${userInfo.token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const json = await res.json();
      const all = json.data || json.tickets || json;
      setTickets(Array.isArray(all) ? all.filter(t => t.event_id === event.id) : []);
    } catch (e) {
      console.error('Error fetching tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);

  // Mock lineup
  const LINEUP = ['Headliner Name', 'Supporting Artist', 'Guest Performer', 'Special Guest', 'DJ Set'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <BgDecor />

      <SafeAreaView style={styles.safeArea}>
        <Header navigation={navigation} onBack={() => navigation.goBack()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Hero */}
          <ImageBackground
            source={{ uri: event.event_image_url || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800' }}
            style={styles.heroBanner}>
            <LinearGradient colors={['rgba(5,10,20,0.1)', 'rgba(5,10,20,0.97)']} style={styles.heroGradient}>
              {(event.category || event.event_category) && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    {(event.category).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.heroTitle}>{event.event_name}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaItem}>
                  <Foundation name="marker" size={13} color="#FFF" />
                  <Text style={styles.heroMetaText}>{event.event_venue || 'TBA'}</Text>
                </View>
                <View style={styles.heroMetaDot} />
                <View style={styles.heroMetaItem}>
                  <Foundation name="calendar" size={13} color={statusColor} />
                  <Text style={[styles.heroMetaText, { color: statusColor }]}>{event.event_date}</Text>
                </View>
                <View style={styles.heroMetaDot} />
                <View style={styles.heroMetaItem}>
                  <Foundation name="clock" size={13} color={statusColor} />
                  <Text style={[styles.heroMetaText, { color: statusColor }]}>{formatTime(event.event_time)}</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.body}>

            {/* Sales Counter Card */}
            <View style={[styles.card, { shadowColor: statusColor }]}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardLabel}>TOTAL TICKETS SOLD</Text>
                  <Text style={styles.cardCountBig}>
                    {loadingTickets ? '—' : dynamicSold.toLocaleString()}
                    <Text style={styles.cardCapacity}> / {loadingTickets ? '—' : dynamicTotal.toLocaleString()}</Text>
                  </Text>
                </View>
                <View style={[styles.pctBadge, { borderColor: statusColor + '50', backgroundColor: statusColor + '15' }]}>
                  <Text style={[styles.pctBadgeText, { color: statusColor }]}>{loadingTickets ? '-' : pct}%</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardSubLeft}>{pct}% of Capacity Sold</Text>
                <Text style={styles.cardSubRight}>{loadingTickets ? '—' : dynamicRemaining.toLocaleString()} Remaining</Text>
              </View>
            </View>

            {/* Ticket Tiers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TICKET TIERS</Text>
              {loadingTickets ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={statusColor} />
                  <Text style={[styles.loadingText, { color: statusColor }]}>Loading tickets…</Text>
                </View>
              ) : tickets.length > 0 ? (
                tickets.map((ticket, index) => {
                  const tkTotal     = parseInt(ticket.original_qty) || 0;
                  const tkRemaining = parseInt(ticket.quantity)     || 0;
                  const tkSold      = Math.max(0, tkTotal - tkRemaining);
                  const tkPct       = tkTotal > 0 ? Math.round((tkSold / tkTotal) * 100) : 0;
                  const tc          = TIER_COLORS[index % TIER_COLORS.length];

                  return (
                    <View key={ticket.id.toString()} style={[styles.tierCard, { borderColor: tc + '55' }]}>
                      <View style={styles.tierTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tierName}>{ticket.name.toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.tierPrice, { color: tc }]}>₱{ticket.price}</Text>
                      </View>
                      <View style={styles.tierStatsRow}>
                        <View style={styles.tierStat}>
                          <Text style={styles.tierStatVal}>{tkSold.toLocaleString()}</Text>
                          <Text style={styles.tierStatLabel}>SOLD</Text>
                        </View>
                        <View style={[styles.tierDivider, { backgroundColor: tc + '30' }]} />
                        <View style={styles.tierStat}>
                          <Text style={styles.tierStatVal}>{tkTotal.toLocaleString()}</Text>
                          <Text style={styles.tierStatLabel}>CAPACITY</Text>
                        </View>
                        <View style={[styles.tierDivider, { backgroundColor: tc + '30' }]} />
                        <View style={styles.tierStat}>
                          <Text style={[styles.tierStatVal, { color: tc }]}>{tkRemaining.toLocaleString()}</Text>
                          <Text style={styles.tierStatLabel}>LEFT</Text>
                        </View>
                      </View>
                      <View style={styles.tierTrack}>
                        <View style={[styles.tierFill, { width: `${tkPct}%`, backgroundColor: tc }]} />
                      </View>
                      <Text style={[styles.tierPct, { color: tc }]}>{tkPct}% Sold</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No ticket tiers found for this event.</Text>
              )}
            </View>

            {/* Event Line-up */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EVENT LINE-UP</Text>
            </View>
          </View>

          {/* Lineup scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lineupScroll}>
            {LINEUP.map((artist, idx) => (
              <TouchableOpacity key={idx} activeOpacity={0.8} style={styles.artistCard}>
                <View style={[styles.artistPhoto, { backgroundColor: statusColor + '18' }]}>
                  <Foundation name="torsos-all" size={32} color={statusColor} />
                </View>
                <View style={[styles.artistInfoBar, { backgroundColor: 'rgba(5,10,20,0.7)' }]}>
                  <Text style={styles.artistName}>{artist}</Text>
                  <Text style={[styles.artistRole, { color: statusColor }]}>
                    {idx === 0 ? 'Headliner' : idx === 1 ? 'Direct Support' : 'Performer'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.body}>

            {/* Seat Plan */}
            {event.seat_plan_url && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SEAT PLAN</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.seatCard}
                  onPress={() => setIsMapVisible(true)}>
                  <Image
                    source={{ uri: event.seat_plan_url }}
                    style={styles.seatImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(5,10,20,0.75)']}
                    style={StyleSheet.absoluteFill}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Event Description */}
            {event.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>EVENT DESCRIPTION</Text>
                <View style={styles.descCard}>
                  <Text
                    style={styles.descText}
                    numberOfLines={isDescExpanded ? undefined : 3}>
                    {event.description}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsDescExpanded(v => !v)}
                    style={styles.readMoreBtn}>
                    <Text style={styles.readMoreText}>
                      {isDescExpanded ? 'Show Less' : 'Read More'}
                    </Text>
                    <View style={[styles.arrowIcon, isDescExpanded && styles.arrowRotated]} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ height: 50 }} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Seat Map Zoom Modal */}
      <Modal
        visible={isMapVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMapVisible(false)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsMapVisible(false)}>
            <Text style={styles.modalCloseText}>✕  CLOSE</Text>
          </TouchableOpacity>
          <ScrollView
            style={styles.modalScrollArea}
            contentContainerStyle={styles.modalScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}>
            <Image
              source={{ uri: event.seat_plan_url }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#050A14' },
  safeArea: { flex: 1 },

  // BG Decor
  bgOrb1:   { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: '#00C2FF', top: -150, left: -200, opacity: 0.03 },
  bgOrb2:   { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#FF4D6A', bottom: -50, right: -150, opacity: 0.02 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.025)' },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#132035' },
  headerBranding:{ fontSize: 20 },
  headerMedia:   { color: '#FFF', fontWeight: '600' },
  headerTix:     { color: '#00C2FF', fontWeight: '800' },
  profileBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#132035', padding: 2 },
  profileAvatar: { flex: 1, borderRadius: 16, backgroundColor: '#00C2FF', opacity: 0.5 },

  // Scroll
  scroll: { paddingBottom: 0 },
  body:   { paddingHorizontal: 20 },

  // Hero Banner — edge to edge
  heroBanner:   { width: '100%', height: 290 },
  heroGradient: { flex: 1, justifyContent: 'flex-end', padding: 20, paddingTop: 40 },
  categoryPill: { alignSelf: 'flex-start', backgroundColor: '#FFD700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
  categoryPillText: { color: '#050A14', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  heroTitle:    { color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 },
  heroMetaRow:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: '#4A8AAF' },
  heroMetaText: { color: '#C0D0E0', fontSize: 12, fontWeight: '600' },

  // Sales Card
  card:       { backgroundColor: '#0B1623', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#132035', marginTop: 20, marginBottom: 6, elevation: 10, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  cardRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel:  { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  cardCountBig:{ color: '#FFF', fontSize: 32, fontWeight: '800' },
  cardCapacity:{ color: '#3D6080', fontSize: 20, fontWeight: '600' },
  pctBadge:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pctBadgeText:{ fontSize: 18, fontWeight: '900' },
  progressTrack:{ height: 10, backgroundColor: '#132035', borderRadius: 5, overflow: 'hidden', marginVertical: 14 },
  progressFill: { height: '100%', borderRadius: 5 },
  cardSubLeft:  { color: '#FFF', fontSize: 12, fontWeight: '600' },
  cardSubRight: { color: '#3D6080', fontSize: 12, fontWeight: '600' },

  // Section header
  section:      { marginTop: 24, marginBottom: 4 },
  sectionTitle: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 2, marginBottom: 14 },

  // Ticket Tiers
  tierCard:     { backgroundColor: '#0B1623', borderRadius: 20, padding: 18, borderWidth: 1.5, marginBottom: 12 },
  tierTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tierName:     { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
  tierPrice:    { fontSize: 17, fontWeight: '900' },
  tierStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tierStat:     { flex: 1, alignItems: 'center' },
  tierStatVal:  { color: '#FFF', fontSize: 18, fontWeight: '800' },
  tierStatLabel:{ color: '#3D6080', fontSize: 9, fontWeight: '700', marginTop: 2, letterSpacing: 1 },
  tierDivider:  { width: 1, height: 32, marginHorizontal: 4 },
  tierTrack:    { height: 5, backgroundColor: '#132035', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  tierFill:     { height: '100%', borderRadius: 3 },
  tierPct:      { fontSize: 10, fontWeight: '800', textAlign: 'right', letterSpacing: 1 },

  // Empty / loading
  loadingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  emptyText:   { color: '#4A8AAF', fontSize: 14 },

  // Lineup horizontal scroll (matches PurchaseScreen style)
  lineupScroll: { paddingHorizontal: 20, paddingBottom: 4, gap: 10 },
  artistCard:   { width: 140, height: 200, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0B1623' },
  artistPhoto:  { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  artistInfoBar:{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  artistName:   { color: '#FFF', fontSize: 12, fontWeight: '800' },
  artistRole:   { fontSize: 9, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },

  // Seat Plan
  seatCard:    { height: 220, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0B1623', justifyContent: 'flex-end' },
  seatImage:   { ...StyleSheet.absoluteFillObject },
  seatHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 14 },
  seatHintText:{ color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Description
  descCard:    { backgroundColor: '#0B1623', borderRadius: 20, borderWidth: 1, borderColor: '#132035', overflow: 'hidden' },
  descText:    { color: '#7A99B8', fontSize: 14, lineHeight: 23, paddingHorizontal: 18, paddingTop: 18 },
  readMoreBtn: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  readMoreText: { color: '#00C2FF', fontSize: 13, fontWeight: '700' },
  arrowIcon:    { width: 7, height: 7, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#00C2FF', transform: [{ rotate: '45deg' }], marginTop: -2 },
  arrowRotated: { transform: [{ rotate: '225deg' }], marginTop: 2 },

  // Modal
  modalBg:           { flex: 1, backgroundColor: 'rgba(5,10,20,0.98)', justifyContent: 'center', alignItems: 'center' },
  modalCloseBtn:     { position: 'absolute', top: 60, right: 30, zIndex: 10 },
  modalCloseText:    { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  modalScrollArea:   { width: '100%', flex: 1 },
  modalScrollContent:{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  modalImage:        { width: width, height: height * 0.65 },
  modalHint:         { color: '#4A5568', fontSize: 12, marginBottom: Platform.OS === 'ios' ? 44 : 24 },
});