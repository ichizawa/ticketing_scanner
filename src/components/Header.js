import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

export default function Header({ navigation, onBack }) {
  const { logout } = useContext(AuthContext);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  return (
    <>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.menuBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuBtn}
            activeOpacity={0.7}
          >
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 14 }]} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        )}

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            <Text style={styles.headerMedia}>MediaOne</Text>
            <Text style={styles.headerTix}>Tix</Text>
          </Text>
        </View>

        <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={styles.profileBtn}>
          <View style={styles.profileAvatar} />
        </TouchableOpacity>
      </View>

      {/* Custom Logout Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isLogoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Entypo name="log-out" color="#FF4D6A" size={28} />
            </View>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalLogoutBtn}
                onPress={confirmLogout}
              >
                <Text style={styles.modalLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Header Styles
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  menuBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start', gap: 5 },
  menuLine: { width: 24, height: 2.5, backgroundColor: '#FFFFFF', borderRadius: 2 },
  backArrow: { color: '#FFFFFF', fontSize: 30, fontWeight: '300', marginLeft: 2, lineHeight: 36 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20 },
  headerMedia: { color: '#FFFFFF', fontWeight: '600' },
  headerTix: { color: '#00C2FF', fontWeight: '800' },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#132035', justifyContent: 'center', alignItems: 'center' },
  profileAvatar: { flex: 1, borderRadius: 17, backgroundColor: '#4A8AAF', opacity: 0.8 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0B1623',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1A2A44',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.3)',
  },
  modalIcon: { fontSize: 28 },
  modalTitle: {
    color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 12,
  },
  modalMessage: {
    color: '#A0B3C6', fontSize: 15, textAlign: 'center', marginBottom: 30, lineHeight: 22, paddingHorizontal: 10,
  },
  modalButtonRow: {
    flexDirection: 'row', width: '100%', justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#1A2A44', backgroundColor: '#132035', marginRight: 8, alignItems: 'center',
  },
  modalCancelText: { color: '#4A8AAF', fontSize: 15, fontWeight: '700' },
  modalLogoutBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#3ec2ff', marginLeft: 8, alignItems: 'center', shadowColor: '#FF4D6A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalLogoutText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});