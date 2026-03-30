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

  // Calculate ticket percentage for the progress bar
  const ticketProgress = event.event_total_tickets > 0
    ? (event.tickets_sold / event.event_total_tickets) * 100
    : 0;

  const statusConfig = getStatusConfig(event.status);

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
      
      // Handle your API wrapper (data, tickets, or raw array)
      const allTickets = json.data || json.tickets || json;
      
      // Filter the list to ONLY show tickets for THIS specific event
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

      {/* Absolute Background Orbs */}
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
                <Text style={{ color: '#4A8AAF' }}>No Image Available</Text>
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

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DATE & TIME</Text>
                <Text style={styles.infoValue}>{event.event_date} @ {event.event_time}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>VENUE</Text>
                <Text style={styles.infoValue}>{event.event_venue}</Text>
              </View>
            </View>

            {/* Ticket Progress Section */}
            <View style={styles.ticketSection}>
              <View style={styles.ticketHeader}>
                <Text style={styles.sectionTitle}>Tickets Sold</Text>
                <Text style={styles.ticketCount}>{event.tickets_sold || 0} / {event.event_total_tickets}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${ticketProgress}%` }]} />
              </View>
            </View>

            {/* --- NEW TICKET CATEGORIES SECTION --- */}
            <Text style={styles.sectionTitle}>Ticket Categories</Text>
            
            {loadingTickets ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#00C2FF" />
                <Text style={styles.loadingText}>Loading tickets...</Text>
              </View>
            ) : tickets.length > 0 ? (
              tickets.map((ticket) => (
                <View 
                  key={ticket.id.toString()} 
                  style={[styles.ticketTypeCard, { borderLeftColor: ticket.color || '#00C2FF' }]}
                >
                  <View style={styles.ticketTypeRow}>
                    <View>
                      <Text style={styles.ticketTypeName}>{ticket.name}</Text>
                      {/* Badge using the hex color from your database */}
                      <View style={[styles.typeBadge, { backgroundColor: (ticket.color || '#00C2FF') + '20' }]}>
                        <Text style={[styles.typeBadgeText, { color: ticket.color || '#00C2FF' }]}>
                          {ticket.type}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.ticketTypeRight}>
                      <Text style={styles.ticketPrice}>PHP {ticket.price}</Text>
                      <Text style={styles.ticketQty}>{ticket.quantity} / {ticket.original_qty} left</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.description}>No ticket categories found for this event.</Text>
            )}
            {/* -------------------------------------- */}

            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>{event.description}</Text>

            {/* Seat Plan Section */}
            {event.seat_plan_url && (
              <>
                <Text style={styles.sectionTitle}>Seat Plan</Text>
                <TouchableOpacity activeOpacity={0.9}>
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
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#00C2FF', top: -50, left: -100, opacity: 0.05,
  },
  bgOrb2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#FF4D6A', top: 200, right: -100, opacity: 0.04,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#132035', justifyContent: 'center', alignItems: 'center'
  },
  backBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '300' },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },

  scrollContent: { paddingBottom: 60 },

  imageContainer: {
    marginHorizontal: 20, marginTop: 10,
    borderRadius: 24, overflow: 'hidden',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10,
  },
  heroImage: { width: '100%', height: 240 },
  placeholderImage: { width: '100%', height: 240, backgroundColor: '#132035', justifyContent: 'center', alignItems: 'center' },

  statusPill: {
    position: 'absolute', top: 15, right: 15,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  statusText: {
    fontSize: 10, fontWeight: '900',
  },

  // --- DYNAMIC STATUS STYLES ---
  upcomingPill: { backgroundColor: 'rgba(251, 255, 19, 0.9)' },
  upcomingText: { color: '#000000' },

  activePill: { backgroundColor: 'rgba(14, 121, 0, 0.9)' },
  activeText: { color: '#FFFFFF' },

  ongoingPill: { backgroundColor: 'rgba(0, 51, 203, 0.9)' },
  ongoingText: { color: '#FFFFFF' },

  completedPill: { backgroundColor: 'rgba(75, 75, 75, 0.9)' },
  completedText: { color: '#FFFFFF' },

  cancelPill: { backgroundColor: 'rgba(255, 77, 106, 0.9)' },
  cancelText: { color: '#FFFFFF' },

  contentContainer: { paddingHorizontal: 24, marginTop: 25 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 20 },

  infoCard: {
    backgroundColor: '#0D1526', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#1A2A44', marginBottom: 25,
  },
  infoItem: { marginVertical: 4 },
  infoLabel: { color: '#4A8AAF', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  infoValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#1A2A44', marginVertical: 12 },

  ticketSection: { marginBottom: 25 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  ticketCount: { color: '#00C2FF', fontWeight: '700', fontSize: 14 },
  progressBarBg: { height: 8, backgroundColor: '#132035', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00C2FF', borderRadius: 4 },

  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 10 },
  description: { color: '#A0B3C6', fontSize: 15, lineHeight: 24, marginBottom: 25 },

  seatPlanImage: {
    width: '100%', height: 200, borderRadius: 16,
    backgroundColor: '#132035', marginTop: 5, borderWidth: 1, borderColor: '#1A2A44'
  },

  // --- NEW STYLES FOR TICKET CATEGORIES ---
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  loadingText: {
    color: '#00C2FF',
    marginLeft: 10,
    fontSize: 14,
  },
  ticketTypeCard: {
    backgroundColor: '#0B1623',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A2A44',
    borderLeftWidth: 4, 
  },
  ticketTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTypeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ticketTypeRight: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  ticketQty: {
    color: '#4A8AAF',
    fontSize: 12,
    fontWeight: '600',
  },
});