import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;

  // Calculate ticket percentage for the progress bar
  const ticketProgress = event.event_total_tickets > 0 
    ? (event.tickets_sold / event.event_total_tickets) * 100 
    : 0;

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
            <View style={[styles.statusPill, event.status !== 1 && styles.inactivePill]}>
              <Text style={styles.statusText}>{event.status === 1 ? '• ACTIVE' : '• INACTIVE'}</Text>
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
    backgroundColor: 'rgba(0, 229, 160, 0.9)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  inactivePill: { backgroundColor: 'rgba(255, 77, 106, 0.9)' },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

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
});