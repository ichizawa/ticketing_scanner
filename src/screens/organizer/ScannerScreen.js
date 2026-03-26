import {
  StyleSheet, Text, View, TouchableOpacity,
  Animated, Dimensions, StatusBar
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

const { width, height } = Dimensions.get('window')
const SCANNER_SIZE = width * 0.72

// Mock scan result data
const MOCK_VALID = {
  status: 'valid',
  name: 'Jordan Reyes',
  event: 'MediaOne Summer Fest 2025',
  ticket: 'VIP — GA Floor',
  seat: 'Section A · Row 4 · Seat 12',
  time: '7:00 PM',
  id: 'M1T-00482-VIP',
}
const MOCK_INVALID = {
  status: 'invalid',
  name: 'Unknown',
  event: '—',
  ticket: '—',
  seat: '—',
  time: '—',
  id: 'M1T-99999-ERR',
}
const MOCK_USED = {
  status: 'used',
  name: 'Alex Kim',
  event: 'MediaOne Summer Fest 2025',
  ticket: 'General Admission',
  seat: 'Section C · Open Floor',
  time: '7:00 PM',
  id: 'M1T-00219-GA',
  scannedAt: '6:42 PM',
}

export default function ScannerScreen({ navigation }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const [scanResult, setScanResult] = useState(null)
  const [resultData, setResultData] = useState(null)
  const [isScanning, setIsScanning] = useState(true)
  const [scanCount, setScanCount] = useState(0)
  const [successCount, setSuccessCount] = useState(0)

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const resultSlide = useRef(new Animated.Value(300)).current
  const resultOpacity = useRef(new Animated.Value(0)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current
  const cornerGlow = useRef(new Animated.Value(0)).current
  const headerFade = useRef(new Animated.Value(0)).current
  const statsSlide = useRef(new Animated.Value(-30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(statsSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start()
  }, [])

  useEffect(() => {
    if (!isScanning) return

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    )
    loop.start()

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    )
    pulse.start()

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerGlow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(cornerGlow, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    )
    glow.start()

    return () => { loop.stop(); pulse.stop(); glow.stop() }
  }, [isScanning])

  const showResult = (data) => {
    setIsScanning(false)
    setResultData(data)
    setScanResult(data.status)
    setScanCount(c => c + 1)
    if (data.status === 'valid') setSuccessCount(c => c + 1)

    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(resultSlide, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()
  }

  const dismissResult = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(resultSlide, { toValue: 300, duration: 220, useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setScanResult(null)
      setResultData(null)
      setIsScanning(true)
      scanLineAnim.setValue(0)
    })
  }

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  })

  const glowOpacity = cornerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  })

  const getStatusConfig = (status) => {
    switch (status) {
      case 'valid': return { color: '#00E5A0', bg: '#001A12', label: 'VALID TICKET', icon: '✓', borderColor: '#00E5A0' }
      case 'invalid': return { color: '#FF4D6A', bg: '#1A0008', label: 'INVALID TICKET', icon: '✕', borderColor: '#FF4D6A' }
      case 'used': return { color: '#FFB84D', bg: '#1A1000', label: 'ALREADY SCANNED', icon: '!', borderColor: '#FFB84D' }
      default: return {}
    }
  }

  const statusConfig = scanResult ? getStatusConfig(scanResult) : null

  // Early returns if permissions or device aren't ready yet
  if (!hasPermission) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#3D6080' }}>Waiting for camera permission...</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FF4D6A' }}>No camera device found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      {[...Array(6)].map((_, i) => (
        <View key={i} style={[styles.gridLine, { top: (height / 6) * i }]} />
      ))}

      <SafeAreaView style={styles.safeArea}>

        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              <Text style={styles.headerMedia}>MediaOne</Text>
              <Text style={styles.headerTix}>Tix</Text>
            </Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation?.toggleDrawer?.()} style={styles.menuBtn}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 14 }]} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[
          styles.statsBar,
          { transform: [{ translateY: statsSlide }], opacity: headerFade }
        ]}>
          {[
            { value: scanCount, label: 'SCANNED', color: '#FFFFFF' },
            { value: successCount, label: 'VALID', color: '#00E5A0' },
            { value: scanCount - successCount, label: 'REJECTED', color: '#FF4D6A' },
            { value: 142, label: 'REMAINING', color: '#FFB84D' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </Animated.View>

        <View style={styles.scannerArea}>
          <Text style={styles.scanPrompt}>
            {isScanning ? 'Point camera at ticket QR code' : 'Processing...'}
          </Text>

          <View style={styles.scannerFrame}>
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isScanning}
              onFrameProcessor={(frame) => {
                // will add QR detection later
              }}
            />

            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}>
              <View style={styles.scanLineBar} />
              <View style={styles.scanLineGlow} />
            </Animated.View>
            <Animated.View style={[styles.corner, styles.cornerTL, { opacity: glowOpacity }]} />
            <Animated.View style={[styles.corner, styles.cornerTR, { opacity: glowOpacity }]} />
            <Animated.View style={[styles.corner, styles.cornerBL, { opacity: glowOpacity }]} />
            <Animated.View style={[styles.corner, styles.cornerBR, { opacity: glowOpacity }]} />
          </View>

          <View style={styles.scanStatusRow}>
            <View style={styles.scanStatusDot} />
            <Text style={styles.scanStatusText}>AUTO-DETECT ENABLED</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.ctrlBtn} onPress={() => showResult(MOCK_USED)}>
            <Text style={styles.ctrlIcon}>⏱</Text>
            <Text style={styles.ctrlLabel}>USED</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainScanBtn} onPress={() => showResult(MOCK_VALID)}>
            <View style={styles.mainScanRing}>
              <View style={styles.mainScanCore}>
                <Text style={styles.mainScanIcon}>◈</Text>
                <Text style={styles.mainScanLabel}>SCAN</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ctrlBtn} onPress={() => showResult(MOCK_INVALID)}>
            <Text style={styles.ctrlIcon}>✕</Text>
            <Text style={styles.ctrlLabel}>DENY</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.manualRow}>
          <TouchableOpacity style={styles.manualBtn}>
            <Text style={styles.manualBtnText}>Enter Ticket ID Manually</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      {scanResult && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={styles.overlayBg} onPress={dismissResult} activeOpacity={1} />

          <Animated.View style={[
            styles.resultCard,
            { transform: [{ translateY: resultSlide }], opacity: resultOpacity },
            { borderTopColor: statusConfig?.borderColor + '60' },
          ]}>
            <View style={[styles.resultHeader, { backgroundColor: statusConfig?.bg }]}>
              <View style={[styles.resultIconRing, { borderColor: statusConfig?.color }]}>
                <Text style={[styles.resultIconText, { color: statusConfig?.color }]}>
                  {statusConfig?.icon}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultStatusLabel, { color: statusConfig?.color }]}>
                  {statusConfig?.label}
                </Text>
                <Text style={styles.resultIdText}>{resultData?.id}</Text>
              </View>
              <TouchableOpacity onPress={dismissResult} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.resultBody}>
              <Text style={styles.attendeeName}>{resultData?.name}</Text>
              <Text style={styles.eventName}>{resultData?.event}</Text>

              <View style={styles.bodyDivider} />

              <View style={styles.infoGrid}>
                {[
                  { label: 'TICKET TYPE', value: resultData?.ticket },
                  { label: 'SHOW TIME', value: resultData?.time },
                  { label: 'SEAT', value: resultData?.seat },
                  resultData?.scannedAt
                    ? { label: 'FIRST SCANNED', value: resultData.scannedAt, highlight: '#FFB84D' }
                    : null,
                ].filter(Boolean).map((item) => (
                  <View key={item.label} style={styles.infoCell}>
                    <Text style={styles.infoCellLabel}>{item.label}</Text>
                    <Text style={[styles.infoCellValue, item.highlight && { color: item.highlight }]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.tearLine}>
                {[...Array(14)].map((_, i) => <View key={i} style={styles.tearDot} />)}
              </View>

              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: statusConfig?.color }]}
                onPress={dismissResult}
              >
                <Text style={styles.ctaBtnText}>
                  {scanResult === 'valid' ? 'ADMIT GUEST  →' : 'SCAN NEXT  →'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050A14' },

  bgOrb1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#00C2FF', top: -100, right: -100, opacity: 0.04,
  },
  bgOrb2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#00E5A0', bottom: 80, left: -80, opacity: 0.04,
  },
  gridLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#4A8AAF', fontSize: 20 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 20 },
  headerMedia: { color: '#FFFFFF', fontWeight: '600' },
  headerTix: { color: '#00C2FF', fontWeight: '800' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E5A0' },
  liveText: { color: '#00E5A0', fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', gap: 4 },
  menuLine: { width: 18, height: 1.5, backgroundColor: '#4A8AAF', borderRadius: 1 },

  // Stats
  statsBar: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#0B1623', borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#132035',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { color: '#2E4A62', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#132035', marginVertical: 6 },

  // Scanner
  scannerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanPrompt: { color: '#3D6080', fontSize: 12, letterSpacing: 1, marginBottom: 20, fontWeight: '500' },

  scannerFrame: {
    width: SCANNER_SIZE, height: SCANNER_SIZE,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    position: 'relative', 
  },

  corner: { position: 'absolute', width: 28, height: 28 },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#00C2FF', borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#00C2FF', borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#00C2FF', borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#00C2FF', borderBottomRightRadius: 4 },
  cornerDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#00C2FF', opacity: 0.5 },

  scanLine: { position: 'absolute', left: 4, right: 4, top: 0, zIndex: 10 },
  scanLineBar: { height: 2, backgroundColor: '#00C2FF', opacity: 0.9 },
  scanLineGlow: { height: 20, marginTop: -11, backgroundColor: '#00C2FF', opacity: 0.08, borderRadius: 10 },

  reticleOuter: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1, borderColor: 'rgba(0,194,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  reticleInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,194,255,0.35)' },

  qrGhost: { position: 'absolute', bottom: 22, right: 22, opacity: 0.07 },
  qrRow: { flexDirection: 'row' },
  qrCell: { width: 8, height: 8, margin: 1, borderRadius: 1 },
  qrCellSolid: { backgroundColor: '#00C2FF' },
  qrCellOutline: { borderWidth: 1, borderColor: '#00C2FF' },

  scanStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  scanStatusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#00E5A0' },
  scanStatusText: { color: '#2E4A62', fontSize: 10, fontWeight: '700', letterSpacing: 2 },

  // Controls
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingBottom: 8, gap: 28,
  },
  ctrlBtn: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#0B1623', borderWidth: 1, borderColor: '#132035',
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  ctrlIcon: { fontSize: 18, color: '#3D6080' },
  ctrlLabel: { fontSize: 8, color: '#2E4A62', fontWeight: '700', letterSpacing: 1.5 },

  mainScanBtn: {},
  mainScanRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, borderColor: '#00C2FF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00C2FF', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  mainScanCore: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#00C2FF', alignItems: 'center', justifyContent: 'center',
  },
  mainScanIcon: { fontSize: 22, color: '#050A14' },
  mainScanLabel: { fontSize: 8, color: '#050A14', fontWeight: '900', letterSpacing: 2, marginTop: -1 },

  manualRow: { alignItems: 'center', paddingBottom: 14 },
  manualBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  manualBtnText: { color: '#2E4A62', fontSize: 12, fontWeight: '500' },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end',
    backgroundColor: 'rgba(5,10,20,0.85)', zIndex: 100,
  },
  overlayBg: { flex: 1 },

  resultCard: {
    backgroundColor: '#0B1623',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderLeftColor: '#132035', borderRightColor: '#132035',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 20,
  },

  resultHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, gap: 14,
  },
  resultIconRing: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  resultIconText: { fontSize: 20, fontWeight: '800' },
  resultStatusLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  resultIdText: { color: '#3D6080', fontSize: 11, fontWeight: '500', marginTop: 2, letterSpacing: 1 },
  closeBtn: { padding: 8 },
  closeBtnText: { color: '#3D6080', fontSize: 14 },

  resultBody: { paddingHorizontal: 24, paddingBottom: 36 },
  attendeeName: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  eventName: { color: '#4A6080', fontSize: 13, marginTop: 2, marginBottom: 16 },
  bodyDivider: { height: 1, backgroundColor: '#132035', marginBottom: 16 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
  infoCell: { width: '47%' },
  infoCellLabel: { color: '#2E4A62', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  infoCellValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  tearLine: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginVertical: 16, paddingHorizontal: 4,
  },
  tearDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#0F1E30' },

  ctaBtn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { color: '#050A14', fontSize: 13, fontWeight: '900', letterSpacing: 2.5 },
});