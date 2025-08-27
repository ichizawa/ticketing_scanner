import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, ImageBackground, FlatList, Image } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { AuthContext } from './context/AuthContext'
import { BASE_URL, processResponse } from './config'

const { width } = Dimensions.get('window')

export default function ScannerDashboard({ navigation }) {
  const { userDetails } = useContext(AuthContext);
  const [dashboardDetails, setDashboardDetails] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  const scanStats = [
    { title: 'Scanned Today', count: dashboardDetails?.scanned_tickets || 0, color: '#4CAF50', icon: <Image source={require('../assets/qr.png')} style={{ width: 30, height: 30, tintColor: 'white' }} /> },
    { title: 'Total Tickets', count: dashboardDetails?.total_tickets || 0, color: '#2196F3', icon: <Image source={require('../assets/shield-trust.png')} style={{ width: 30, height: 30, tintColor: 'white' }} /> },
    { title: 'Invalid/Fraud', count: dashboardDetails?.invalid_tickets || 0, color: '#FF5722', icon: <Image source={require('../assets/octagon-xmark.png')} style={{ width: 30, height: 30, tintColor: 'white' }} /> },
    { title: 'Pending Check', count: dashboardDetails?.pending_tickets || 0, color: '#FF9800', icon: <Image source={require('../assets/pending.png')} style={{ width: 30, height: 30, tintColor: 'white' }} /> }
  ]

  // const recentScans = [
  //   { id: 'TKT-98234', event: 'Music Festival 2024', status: 'Valid', gate: 'A1', time: '2 min ago', type: 'VIP' },
  // ]

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return '#FF5722'
      case 1: return '#4CAF50'
      default: return '#607D8B'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'VIP': return '#9C27B0'
      case 'Premium': return '#FF9800'
      case 'General': return '#2196F3'
      default: return '#607D8B'
    }``
  }

  const getDashboard = () => {
    try {
      fetch(`${BASE_URL}dashboard`, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          'Authorization': `Bearer ${userDetails.token}`
        }
      }).then(processResponse).then((res) => {
        const { statusCode, data } = res;
        // console.info(data);
        if (statusCode == 200) {
          setRecentScans(data.data.recent_scans);
          setDashboardDetails(data.data);
        }
      }).catch((error) => {
        console.error(error);
        Alert.alert("Error", error.message);
      });
    } catch (error) {
      Alert.alert("Error", error.message);
      console.error(error);
    }
    // console.log(userDetails.token);
  };

  useEffect(() => {
    getDashboard();
  }, []);

  return (
    <ImageBackground
      source={require('../assets/bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#113F67', '#58A0C8']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Mediaonetix</Text>
          <Text style={styles.headerSubtitle}>Real-time ticket validation & entry control</Text>
          <View style={styles.scannerStatus}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>Scanner Active • Gate A1</Text>
          </View>
        </LinearGradient>

        {/* Scan Stats Cards */}
        <View style={styles.statsContainer}>
          {scanStats.map((stat, index) => (
            <TouchableOpacity key={index} style={styles.statCard}>
              <LinearGradient
                colors={[stat.color, `${stat.color}90`]}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statCount}>{stat.count.toLocaleString()}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scanner Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scanner Actions</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Scanner')} style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}>
              {/* <Text style={styles.actionButtonIcon}>📷</Text> */}
              <Image source={require('../assets/camera.png')} style={[styles.actionButtonIcon, { width: 20, height: 20, tintColor: 'white' }]} />
              <Text style={styles.actionButtonText}>Scan Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Sales')} style={[styles.actionButton, { backgroundColor: '#2196F3' }]}>
              {/* <Text style={styles.actionButtonIcon}>🔍</Text> */}
              <Image source={require('../assets/search-alt.png')} style={[styles.actionButtonIcon, { width: 20, height: 20, tintColor: 'white' }]} />
              <Text style={styles.actionButtonText}>Manual Lookup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF9800' }]}>
              {/* <Text style={styles.actionButtonIcon}>📊</Text> */}
              <Image source={require('../assets/big-data-analytics.png')} style={[styles.actionButtonIcon, { width: 20, height: 20, tintColor: 'white' }]} />
              <Text style={styles.actionButtonText}>Scan Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Scans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <View style={styles.scansContainer}>
            {recentScans?.map((scan, index) => (
              <TouchableOpacity key={index} style={styles.scanCard}>
                <View style={styles.scanHeader}>
                  <Text style={styles.ticketId}>{scan.reference_num}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: scan.sale?.ticket?.ticket_color || '#999' }]}>
                    <Text style={styles.typeText}>{scan.sale?.ticket?.ticket_type}</Text>
                  </View>
                </View>
                <Text style={styles.eventName}>{scan.sale?.event?.event_name}</Text>
                <View style={styles.scanDetails}>
                  <Text style={styles.gateText}>{scan.sale?.ticket?.ticket_name}</Text>
                  <Text style={styles.scanTime}>
                    {new Date(scan.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                </View>
                <View style={styles.scanFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(scan.is_redeemed) }]}>
                    <Text style={styles.statusText}>{scan.is_redeemed == 1 ? 'Redeemed' : 'Pending'}</Text>
                  </View>
                  {scan.is_redeemed == 1 && <Text style={styles.checkIcon}>✓</Text>}
                  {/* {scan.status === 'Invalid' && <Text style={styles.crossIcon}>✗</Text>} */}
                  {scan.is_redeemed == 0 && <Text style={styles.warningIcon}>⚠</Text>}
                </View>
              </TouchableOpacity>
            )) || <Text style={styles.noScansText}>No recent scans found.</Text>}
          </View>
        </View>

        {/* Scanner Performance */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scanner Performance</Text>
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>95.3%</Text>
              <Text style={styles.metricLabel}>Scan Success Rate</Text>
              <View style={styles.metricTrend}>
                <Text style={styles.trendUp}>↗ 2.1%</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>1.2s</Text>
              <Text style={styles.metricLabel}>Avg Scan Time</Text>
              <View style={styles.metricTrend}>
                <Text style={styles.trendDown}>↘ 0.3s</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>4.7%</Text>
              <Text style={styles.metricLabel}>Fraud Detection</Text>
              <View style={styles.metricTrend}>
                <Text style={styles.trendUp}>↗ 1.2%</Text>
              </View>
            </View>
          </View>
        </View> */}

        {/* Event Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Events</Text>
          <View style={styles.eventsContainer}>
            {dashboardDetails?.events?.length > 0 ? (
              dashboardDetails.events.map((event, index) => {
                const scanned = dashboardDetails?.scanned_tickets || 0;
                const total = dashboardDetails?.total_tickets || 1; // prevent divide by zero
                const percentage = Math.min((scanned / total) * 100, 100); // clamp max 100%

                return (
                  <View key={index} style={styles.eventCard}>
                    <Text style={styles.eventTitle}>{event.event_name}</Text>
                    <Text style={styles.eventCapacity}>
                      {scanned} / {total} entered
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noEventsText}>No events found.</Text>
            )}

            {/* <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>Music Festival 2024</Text>
              <Text style={styles.eventCapacity}>892 / 1500 entered</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '59%' }]} />
              </View>
            </View>
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>Concert Hall</Text>
              <Text style={styles.eventCapacity}>234 / 800 entered</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '29%' }]} />
              </View>
            </View> */}
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 15,
  },
  scannerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    width: '45%',
    height: 120,
    marginBottom: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    height: 80,
    marginHorizontal: 5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  scansContainer: {
    gap: 12,
  },
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  eventName: {
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 8,
    lineHeight: 22,
  },
  scanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gateText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
  },
  scanTime: {
    fontSize: 12,
    color: '#718096',
  },
  scanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  crossIcon: {
    fontSize: 18,
    color: '#FF5722',
    fontWeight: 'bold',
  },
  warningIcon: {
    fontSize: 18,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 8,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendUp: {
    fontSize: 12,
    color: '#48bb78',
    fontWeight: '600',
  },
  trendDown: {
    fontSize: 12,
    color: '#f56565',
    fontWeight: '600',
  },
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  eventCapacity: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  noScansText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 16,
  },
});