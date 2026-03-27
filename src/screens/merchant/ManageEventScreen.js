import React, { useEffect, useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  Alert,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../config';
import { AuthContext } from '../../context/AuthContext';

// Import the Header component
import Header from '../../components/Header'; 

const { width } = Dimensions.get('window');

// Background decoration component
const BgDecor = () => (
  <>
    <View style={styles.bgOrb1} />
    <View style={styles.bgOrb2} />
    {[...Array(5)].map((_, i) => (
      <View key={i} style={[styles.gridLine, { top: (width * 0.4) * i }]} />
    ))}
  </>
);

export default function ManageEventScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userInfo } = useContext(AuthContext);

  useEffect(() => {
    if (userInfo?.token) {
      fetchEvents();
    } else {
      setLoading(false);
      setError('Please login to view events');
    }
  }, [userInfo]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userInfo?.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/merchant/events`, {
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const json = await response.json();

      // Handle different API response formats
      const eventData = json.data || json.events || json;
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderEvent = ({ item }) => {
    const accentColor = '#00C2FF';
    const statusColor = '#00E5A0';
    const statusLabel = item.status === 1 ? 'ACTIVE' : 'INACTIVE';

    return (
      <TouchableOpacity 
        style={[styles.eventCard, { borderColor: '#132035' }]} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EventDetails', { event: item })}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.event_name}</Text>
        <Text style={styles.cardVenue}>{item.event_venue}</Text>
        <Text style={[styles.cardSchedule, { color: accentColor }]}>{item.event_date} • {item.event_time}</Text>

        <View style={[styles.cardFooter, { borderTopColor: '#0F1E30' }]}>
          <Text style={[styles.cardFooterText, { color: accentColor }]}>
            VIEW DETAILS  ›
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // --- RETURN STATES ---

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgDecor />
        <SafeAreaView style={styles.safeArea}>
          {/* Header Added Here */}
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00C2FF" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgDecor />
        <SafeAreaView style={styles.safeArea}>
           {/* Header Added Here */}
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchEvents}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <BgDecor />
        <SafeAreaView style={styles.safeArea}>
           {/* Header Added Here */}
          <Header navigation={navigation} />
          <View style={styles.centerContainer}>
            <Text style={styles.noDataText}>No events found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <BgDecor />

      <SafeAreaView style={styles.safeArea}>
         {/* Main Header Added Here */}
        <Header navigation={navigation} />

        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050A14'
  },
  safeArea: {
    flex: 1
  },
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  eventCard: {
    backgroundColor: '#0B1623',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingBottom: 10
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3
  },
  statusText: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase'
  },
  cardTitle: {
    color: '#FFFFFF', fontSize: 17, fontWeight: '800', paddingHorizontal: 16,
    marginBottom: 4, letterSpacing: -0.3
  },
  cardVenue: {
    color: '#4A8AAF', fontSize: 12, fontWeight: '500', paddingHorizontal: 16,
    marginBottom: 3
  },
  cardSchedule: {
    fontSize: 12, fontWeight: '700', paddingHorizontal: 16, marginBottom: 14,
    letterSpacing: 0.3
  },
  cardFooter: {
    borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, marginTop: 4
  },
  cardFooterText: {
    fontSize: 12, fontWeight: '800', letterSpacing: 1.5
  },
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
  retryText: {
    color: '#00C2FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
});