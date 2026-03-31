import { StyleSheet, Text, View, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header'; 

export default function OrganizerHomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      {/* Background Decorative Orbs */}
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          
          <View style={styles.headerSection}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, Organizer</Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Active Events</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>840</Text>
              <Text style={styles.statLabel}>Tickets Sold</Text>
            </View>
          </View>

          {/* Quick Actions Section */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity 
            style={styles.primaryActionCard}
            onPress={() => {
              const firstParent = navigation.getParent();
              const rootNav = firstParent?.getParent ? firstParent.getParent() : firstParent;

              if (rootNav?.navigate) {
                rootNav.navigate('ScanLogin');
              } else if (navigation?.navigate) {
                navigation.navigate('OrganizerScanner');
              } 
            }}
          >
            <View style={styles.iconPlaceholder}>
              <Text style={styles.iconText}>📷</Text>
            </View>
            <View>
              <Text style={styles.actionTitle}>Scan Tickets</Text>
              <Text style={styles.actionDesc}>Verify attendee QR codes</Text>
            </View>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#8A94A6',
    fontSize: 16,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    color: '#00C2FF', 
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    color: '#8A94A6',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  primaryActionCard: {
    backgroundColor: 'rgba(0, 194, 255, 0.1)', // Tinted with your cyan
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.3)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryActionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 194, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconPlaceholderSecondary: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionDesc: {
    color: '#8A94A6',
    fontSize: 14,
  },
  // Decorative backgrounds kept from original style
  bgOrb1: {
    position: 'absolute', 
    width: 320, 
    height: 320, 
    borderRadius: 160,
    backgroundColor: '#00C2FF', 
    top: -100, 
    right: -100, 
    opacity: 0.04,
  },
  bgOrb2: {
    position: 'absolute', 
    width: 240, 
    height: 240, 
    borderRadius: 120,
    backgroundColor: '#00E5A0', 
    bottom: 80, 
    left: -80, 
    opacity: 0.04,
  },
});