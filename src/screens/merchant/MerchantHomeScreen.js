import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  StatusBar, ScrollView, Image, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

import Header from '../../components/Header'; 

const { width } = Dimensions.get('window');

export default function MerchantHomeScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext); 
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ 
    totalRevenue: 0, 
    totalSold: 0, 
    activeCount: 0 
  });

  const fetchMerchantData = async () => {
    try {
      const headers = {
        "Authorization": `Bearer ${userInfo?.token}`,
        "Accept": "application/json",
      };

      const [eventsResponse, salesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/merchant/events`, { method: 'GET', headers }),
        fetch(`${API_BASE_URL}/merchant/sales`, { method: 'GET', headers })
      ]);

      if (!eventsResponse.ok) console.log("❌ Events API Error:", eventsResponse.status);
      if (!salesResponse.ok) console.log("❌ Sales API Error:", salesResponse.status);

      let sold = 0;
      let active = 0;
      let revenue = 0;

      if (eventsResponse.ok) {
        const eventsResult = await eventsResponse.json();
        const eventData = eventsResult.data || eventsResult.events || eventsResult;
        const fetchedEvents = Array.isArray(eventData) ? eventData : [];
        setEvents(fetchedEvents);

        sold = fetchedEvents.reduce((acc, curr) => acc + (Number(curr.tickets_sold) || 0), 0);
        active = fetchedEvents.filter(e => e.status === 1 || e.status === '1').length;
      } else {
        Alert.alert("Events Error", `Could not load events. Status: ${eventsResponse.status}`);
      }

      if (salesResponse.ok) {
        const salesResult = await salesResponse.json();
        
        revenue = Number(salesResult.total_sales) || 0;
        
      } else {
        const errorText = await salesResponse.text();
        console.warn(`⚠️ Sales Error - Status: ${salesResponse.status}`);
        console.warn(`Backend says:`, errorText);
      }

      setStats({ totalRevenue: revenue, totalSold: sold, activeCount: active });

    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Connection Error", "Check your internet connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userInfo?.token) {
      fetchMerchantData();
    }
  }, [userInfo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMerchantData();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(value);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <SafeAreaView style={styles.safeArea}>
        
        <Header navigation={navigation} />

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#00C2FF" />
            <Text style={styles.loadingText}>Syncing Dashboard...</Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C2FF" />
            }
          >
            <View style={styles.businessHeader}>
              <Text style={styles.welcomeText}>MERCHANT PORTAL</Text>
              <Text style={styles.businessName}>Performance Overview</Text>
            </View>

            <View style={styles.statsContainer}>
              <LinearGradient colors={['#132035', '#0B1623']} style={styles.mainStatCard}>
                <Text style={styles.statLabel}>TOTAL REVENUE</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
                <View style={styles.statTag}>
                  <Text style={styles.statTagText}>Gross Earnings</Text>
                </View>
              </LinearGradient>
              
              <View style={styles.secondaryStatsRow}>
                <View style={styles.smallStatCard}>
                  <Text style={styles.smallStatLabel}>TICKETS SOLD</Text>
                  <Text style={styles.smallStatValue}>{stats.totalSold}</Text>
                </View>
                <View style={styles.smallStatCard}>
                  <Text style={styles.smallStatLabel}>ACTIVE EVENTS</Text>
                  <Text style={styles.smallStatValue}>{stats.activeCount}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Manage Active Events</Text>
                <TouchableOpacity onPress={onRefresh}>
                  <Text style={styles.refreshText}>Sync Data</Text>
                </TouchableOpacity>
              </View>

              {events.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No events found.</Text>
                </View>
              ) : (
                events.map((event) => {
                  const progress = event.event_total_tickets > 0 
                    ? (event.tickets_sold / event.event_total_tickets) * 100 
                    : 0;

                  return (
                    <TouchableOpacity 
                      key={event.id?.toString() || Math.random().toString()} 
                      style={styles.eventManageCard}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('EventDetails', { event })}
                    >
                      <Image source={{ uri: event.event_image_url }} style={styles.eventThumb} />
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{event.event_name}</Text>
                        
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>{event.tickets_sold} / {event.event_total_tickets} Sold</Text>
                          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                        </View>
                        
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                      </View>
                      <View style={styles.chevronBox}>
                        <Text style={styles.chevron}>›</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050A14' },
  bgOrb1: { position: 'absolute', width: 350, height: 350, borderRadius: 175, backgroundColor: '#00C2FF', top: -100, right: -150, opacity: 0.04 },
  bgOrb2: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#FF4D6A', bottom: -50, left: -100, opacity: 0.02 },
  safeArea: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#4A8AAF', marginTop: 15, fontSize: 12, fontWeight: '600' },
  scrollContent: { paddingBottom: 50 },
  
  businessHeader: { paddingHorizontal: 20, marginVertical: 24 },
  welcomeText: { color: '#00C2FF', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  businessName: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },

  // Stats Section
  statsContainer: { paddingHorizontal: 20, marginBottom: 35 },
  mainStatCard: {
    padding: 24, borderRadius: 28, marginBottom: 16, borderWidth: 1, borderColor: '#1A2A44', elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
  },
  statLabel: { color: '#4A8AAF', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  statValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  statTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(0, 194, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 12 },
  statTagText: { color: '#00C2FF', fontSize: 10, fontWeight: '700' },
  
  secondaryStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallStatCard: {
    width: '48%', backgroundColor: '#0B1623', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#132035',
  },
  smallStatLabel: { color: '#4A8AAF', fontSize: 10, fontWeight: '700', marginBottom: 6 },
  smallStatValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },

  // API Events Section
  section: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  refreshText: { color: '#00C2FF', fontSize: 13, fontWeight: '600' },
  
  eventManageCard: {
    flexDirection: 'row', backgroundColor: '#0B1623', borderRadius: 24, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#132035', alignItems: 'center'
  },
  eventThumb: { width: 64, height: 64, borderRadius: 16, marginRight: 14, backgroundColor: '#132035' },
  eventInfo: { flex: 1 },
  eventTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: '#4A8AAF', fontSize: 10, fontWeight: '600' },
  progressPercent: { color: '#00C2FF', fontSize: 10, fontWeight: '800' },
  progressBarBg: { height: 5, backgroundColor: '#132035', borderRadius: 2.5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00C2FF', borderRadius: 2.5 },
  
  chevronBox: { marginLeft: 10, opacity: 0.3 },
  chevron: { color: '#FFF', fontSize: 26, fontWeight: '200' },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#4A8AAF', fontSize: 14 }
});