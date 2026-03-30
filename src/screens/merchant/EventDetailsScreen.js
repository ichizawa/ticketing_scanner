import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const { width } = Dimensions.get('window');

const getStatusConfig = (statusCode) => {
  switch (statusCode) {
    case 0: return { label: '• UPCOMING', pillStyle: styles.upcomingPill, textStyle: styles.upcomingText };
    case 1: return { label: '• ACTIVE', pillStyle: styles.activePill, textStyle: styles.activeText };
    case 2: return { label: '• ONGOING', pillStyle: styles.ongoingPill, textStyle: styles.ongoingText };
    case 3: return { label: '• COMPLETED', pillStyle: styles.completedPill, textStyle: styles.completedText };
    default: return { label: '• CANCELLED', pillStyle: styles.cancelPill, textStyle: styles.cancelText };
  }
};

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;
  
  const { userInfo } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const statusConfig = getStatusConfig(event.status);

  // This is for Calculating the total, remaining, and sold tickets dynamically based on the fetched tickets
  const dynamicTotal = tickets.reduce((sum, ticket) => sum + (parseInt(ticket.original_qty) || 0), 0);
  const dynamicRemaining = tickets.reduce((sum, ticket) => sum + (parseInt(ticket.quantity) || 0), 0);
  const dynamicSold = Math.max(0, dynamicTotal - dynamicRemaining);

  useEffect(() => {
    fetchEventTickets();
  }, []);

  const fetchEventTickets = async () => {
    try {
      if (!userInfo?.token) return;

      const response = await fetch(`${API_BASE_URL}/merchant/tickets`, {
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch tickets");

      const json = await response.json();
      
      const allTickets = json.data || json.tickets || json;
      
      const filteredTickets = Array.isArray(allTickets) 
        ? allTickets.filter(ticket => ticket.event_id === event.id)
        : [];

      setTickets(filteredTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <SafeAreaView style={styles.safeArea}>
        {/* Modern Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Hero Image */}
          <View style={styles.imageContainer}>
            {event.event_image_url ? (
              <Image
                source={{ uri: event.event_image_url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={{ color: '#4A8AAF', fontWeight: '600' }}>No Image Available</Text>
              </View>
            )}
            <View style={[styles.statusPill, statusConfig.pillStyle]}>
              <Text style={[styles.statusText, statusConfig.textStyle]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.title}>{event.event_name}</Text>

            {/* Info Card (Date & Venue) */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconPlaceholder}>
                  <Text style={styles.infoIconText}>📅</Text>
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>DATE & TIME</Text>
                  <Text style={styles.infoValue}>{event.event_date} @ {event.event_time}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconPlaceholder}>
                  <Text style={styles.infoIconText}>📍</Text>
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>VENUE</Text>
                  <Text style={styles.infoValue}>{event.event_venue}</Text>
                </View>
              </View>
            </View>

            {/* About & Seat Plan Section */}
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>{event.description}</Text>

            {/* --- UPDATED STATS GRID --- */}
            <Text style={styles.sectionTitle}>Ticket Sales</Text>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>SOLD</Text>
                {loadingTickets ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.statValue}>{dynamicSold}</Text>
                )}
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TOTAL</Text>
                {loadingTickets ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.statValue}>{dynamicTotal}</Text>
                )}
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>REMAINING</Text>
                {loadingTickets ? (
                  <ActivityIndicator size="small" color="#00C2FF" />
                ) : (
                  <Text style={[styles.statValue, { color: '#00C2FF' }]}>{dynamicRemaining}</Text>
                )}
              </View>
            </View>

            {/* Ticket Categories Section */}
            <Text style={styles.sectionTitle}>Categories</Text>
            
            {loadingTickets ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#00C2FF" />
                <Text style={styles.loadingText}>Loading tickets...</Text>
              </View>
            ) : tickets.length > 0 ? (
              <View style={styles.ticketList}>
                {tickets.map((ticket) => (
                  <View 
                    key={ticket.id.toString()} 
                    style={[styles.ticketTypeCard, { borderLeftColor: ticket.color || '#00C2FF' }]}
                  >
                    <View style={styles.ticketTypeLeft}>
                      <Text style={styles.ticketTypeName}>{ticket.name}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: (ticket.color || '#00C2FF') + '20' }]}>
                        <Text style={[styles.typeBadgeText, { color: ticket.color || '#00C2FF' }]}>
                          {ticket.type}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.ticketTypeRight}>
                      <Text style={styles.ticketPrice}>
                        <Text style={styles.currencyText}>PHP </Text>
                        {ticket.price}
                      </Text>
                      <Text style={styles.ticketQty}>{ticket.quantity} / {ticket.original_qty} left</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.description}>No ticket categories found for this event.</Text>
            )}

            {event.seat_plan_url && (
              <>
                <Text style={styles.sectionTitle}>Seat Plan</Text>
                <TouchableOpacity activeOpacity={0.9} style={styles.seatPlanContainer}>
                  <Image
                    source={{ uri: event.seat_plan_url }}
                    style={styles.seatPlanImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050A14' },
  safeArea: { flex: 1 },
  bgOrb1: {
    position: 'absolute', width: 350, height: 350, borderRadius: 175,
    backgroundColor: '#00C2FF', top: -100, left: -150, opacity: 0.06,
  },
  bgOrb2: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#FF4D6A', top: 250, right: -150, opacity: 0.05,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(19, 32, 53, 0.8)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#1A2A44'
  },
  backBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '400' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },

  scrollContent: { paddingBottom: 80 },

  imageContainer: {
    marginHorizontal: 20, marginTop: 10,
    borderRadius: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1A2A44',
  },
  heroImage: { width: '100%', height: 260 },
  placeholderImage: { width: '100%', height: 260, backgroundColor: '#0D1526', justifyContent: 'center', alignItems: 'center' },

  // --- BASE PILL AND TEXT STYLES ---
  statusPill: {
    position: 'absolute', top: 16, right: 16,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // --- DYNAMIC STATUS STYLES ---
  upcomingPill: { backgroundColor: 'rgba(251, 255, 19, 0.95)' },
  upcomingText: { color: '#000000' },
  activePill: { backgroundColor: 'rgba(14, 121, 0, 0.95)' },
  activeText: { color: '#FFFFFF' },
  ongoingPill: { backgroundColor: 'rgba(0, 51, 203, 0.95)' },
  ongoingText: { color: '#FFFFFF' },
  completedPill: { backgroundColor: 'rgba(75, 75, 75, 0.95)' },
  completedText: { color: '#FFFFFF' },
  cancelPill: { backgroundColor: 'rgba(255, 77, 106, 0.95)' },
  cancelText: { color: '#FFFFFF' },

  contentContainer: { paddingHorizontal: 20, marginTop: 24 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginBottom: 24, lineHeight: 38 },

  // --- INFO CARD ---
  infoCard: {
    backgroundColor: 'rgba(13, 21, 38, 0.7)', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#1A2A44', marginBottom: 30,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIconPlaceholder: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#132035',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  infoIconText: { fontSize: 16 },
  infoTextContainer: { flex: 1 },
  infoLabel: { color: '#4A8AAF', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  infoValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#1A2A44', marginVertical: 16, marginLeft: 56 },

  // --- STATS GRID (Replaced Progress Bar) ---
  statsCard: {
    flexDirection: 'row', backgroundColor: 'rgba(13, 21, 38, 0.7)',
    borderRadius: 20, paddingVertical: 20, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#1A2A44', marginBottom: 30,
    justifyContent: 'space-between', alignItems: 'center'
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#4A8AAF', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  statDivider: { width: 1, height: 40, backgroundColor: '#1A2A44' },

  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 16, letterSpacing: 0.5 },
  description: { color: '#A0B3C6', fontSize: 15, lineHeight: 26, marginBottom: 30, fontWeight: '400' },

  // --- TICKET CATEGORIES ---
  ticketList: { marginBottom: 15 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, opacity: 0.8 },
  loadingText: { color: '#00C2FF', marginLeft: 12, fontSize: 15, fontWeight: '600' },
  ticketTypeCard: {
    backgroundColor: 'rgba(11, 22, 35, 0.8)', borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#1A2A44',
    borderLeftWidth: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  ticketTypeLeft: { flex: 1, paddingRight: 10 },
  ticketTypeName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  ticketTypeRight: { alignItems: 'flex-end', justifyContent: 'center' },
  currencyText: { fontSize: 14, fontWeight: '600', color: '#4A8AAF' },
  ticketPrice: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  ticketQty: { color: '#4A8AAF', fontSize: 13, fontWeight: '700' },

  // --- SEAT PLAN ---
  seatPlanContainer: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#1A2A44',
    backgroundColor: '#0D1526', padding: 10, marginBottom: 20
  },
  seatPlanImage: { width: '100%', height: 220, borderRadius: 12 },
});