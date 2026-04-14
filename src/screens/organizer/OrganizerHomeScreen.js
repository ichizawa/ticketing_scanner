import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, StatusBar, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import Header from '../../components/Header';

export default function OrganizerHomeScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    activeCount: 0
  });

  const fetchMerchantData = useCallback(async () => {
    try {
      const headers = {
        "Authorization": `Bearer ${userInfo?.token}`,
        "Accept": "application/json",
      };

      const response = await fetch(`${API_BASE_URL}/staff/events`, { method: 'GET', headers });

      if (response.ok) {
        const result = await response.json();
        const eventData = result.data || result.events || result;
        const fetchedEvents = Array.isArray(eventData) ? eventData : [];

        setEvents(fetchedEvents);
        setStats({
          activeCount: fetchedEvents.filter(e => e.status === 1 || e.status === '1').length,
          totalRevenue: result.totalRevenue || 0, // Assuming API might provide these
          totalSold: result.totalSold || 0
        });
      } else {
        Alert.alert("Error", "Failed to fetch dashboard data.");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo?.token) fetchMerchantData();
  }, [fetchMerchantData, userInfo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMerchantData();
  };

  const handleScanNavigation = () => {
    if (navigation.canGoBack()) {
      const parent = navigation.getParent();
      parent?.navigate('ScanLogin');
    } else {
      navigation.navigate('OrganizerScanner');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background Decor */}
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <SafeAreaView style={styles.container} edges={['top']}>
        <Header navigation={navigation} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C2FF" />
          }
        >
          {/* Welcome Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, {userInfo?.name || 'Organizer'}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeCount}</Text>
              <Text style={styles.statLabel}>Active Events</Text>
            </View>
          </View>

          {/* Action Section */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.primaryActionCard}
            onPress={handleScanNavigation}
            activeOpacity={0.7}
          >
            <View style={styles.iconBox}>
              <Text style={styles.iconEmoji}>📷</Text>
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>Scan Tickets</Text>
              <Text style={styles.actionDesc}>Instant QR verification</Text>
            </View>
          </TouchableOpacity>
          {loading && <ActivityIndicator color="#00C2FF" style={{ marginTop: 20 }} />}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050A14'
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginTop: 15,
    marginBottom: 25,
  },
  title: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: '#8A94A6',
    fontSize: 16,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statNumber: {
    color: '#00C2FF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8A94A6',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  primaryActionCard: {
    backgroundColor: 'rgba(0, 194, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.2)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryActionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 194, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  actionTextContent: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  actionDesc: {
    color: '#8A94A6',
    fontSize: 13,
    marginTop: 2,
  },
  arrowIcon: {
    color: '#00C2FF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bgOrb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#00C2FF',
    top: -50,
    right: -100,
    opacity: 0.05,
  },
  bgOrb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00E5A0',
    bottom: 50,
    left: -50,
    opacity: 0.03,
  },
});