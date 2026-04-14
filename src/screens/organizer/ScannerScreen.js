import { StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions, StatusBar } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { useIsFocused } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import Header from '../../components/Header'
import { API_BASE_URL } from '../../config'
import { AuthContext } from '../../context/AuthContext'

const { width, height } = Dimensions.get('window')
const SCANNER_SIZE = width * 0.72

export default function ScannerScreen({ navigation }) {
  const isFocused = useIsFocused()
  const { userInfo } = useContext(AuthContext)
  const [permission, requestPermission] = useCameraPermissions()
  const [scanResult, setScanResult] = useState(null)
  const [resultData, setResultData] = useState(null)
  const [isScanning, setIsScanning] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [scanCount, setScanCount] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [lastScannedValue, setLastScannedValue] = useState(null)

  const extractRefNumber = (rawValue) => {
    if (!rawValue) return null
    const text = String(rawValue).trim()
    try {
      const parsed = JSON.parse(text)
      return (
        parsed?.refNumber ??
        parsed?.ref_number ??
        parsed?.referenceNumber ??
        parsed?.reference_number ??
        parsed?.ticketId ??
        parsed?.ticket_id ??
        parsed?.id ??
        text
      )
    } catch (error) {
      const matchedValue = text.match(/(?:refNumber|ref_number|referenceNumber|reference_number|ticketId|ticket_id|id)[=/:]([^&/\s]+)/i)
      return matchedValue?.[1] ? decodeURIComponent(matchedValue[1]) : text
    }
  }

  const getPayloadStatus = (payload, httpStatus = 200) => {
    const combinedText = [
      payload?.status,
      payload?.message,
      payload?.error,
      payload?.ticket?.status,
      payload?.data?.status,
      payload?.data?.ticket?.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const wasScanned =
      payload?.ticket?.is_scanned ??
      payload?.data?.ticket?.is_scanned ??
      payload?.data?.is_scanned ??
      payload?.is_scanned ??
      payload?.is_redeemed
      
    if (wasScanned || combinedText.includes('already scanned') || combinedText.includes('already used') || combinedText.includes('used')) {
      return 'used'
    }

    if (
      httpStatus !== 200 ||
      combinedText.includes('invalid') ||
      combinedText.includes('not found') ||
      combinedText.includes('expired') ||
      combinedText.includes('denied') ||
      combinedText.includes('not yet paid') ||
      combinedText.includes('disabled')
    ) {
      return 'invalid'
    }
    return 'valid'
  }

  const buildResultFromApi = (payload, refNumber, forcedStatus = null) => {
    const status = forcedStatus ?? getPayloadStatus(payload);
    const data = payload?.data ?? payload ?? {};
    const ticketDetails = data?.ticket ?? {};
    const eventDetails = data?.event ?? {};

    const formatDateTime = (dateInput) => {
      if (!dateInput) return null;
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');

      return `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;
    };

    const currentFormattedTime = formatDateTime(new Date());
    const dbFormattedTime = formatDateTime(ticketDetails?.updated_at);
    let noteText = payload?.message ?? payload?.error ?? null;

    if (typeof noteText === 'string' && (noteText.includes('The route') || noteText.includes('api/'))) {
      noteText = 'Unrecognized or invalid QR code format.';
    }

    return {
      status,
      name: data?.customer_name ?? ticketDetails?.customer_name ?? 'Unknown Guest',
      ticket: data?.type ?? ticketDetails?.type ?? 'Ticket Invalid',
      event: eventDetails?.event_name ?? eventDetails?.event_title ?? 'Event Unspecified',
      seat: data?.seat ?? ticketDetails?.seat ?? 'Unknown Seat',
      time: eventDetails?.time ?? data?.time ?? '—',
      id: refNumber,
      scannedAt: status === 'valid' ? currentFormattedTime : (dbFormattedTime ?? currentFormattedTime),
      note: noteText,
    }
  }

  const verifyAndScanTicket = async (rawValue) => {
    const refNumber = extractRefNumber(rawValue)
    if (!refNumber) {
      showResult({ status: 'invalid', event: 'QR code unreadable', id: 'NO-REF' })
      return
    }

    if (!isConnected) {
      showResult({
        status: 'invalid',
        event: 'No internet connection',
        ticket: 'Reconnect to validate',
        id: refNumber,
      })
      return
    }

    if (!userInfo?.token) {
      showResult({
        status: 'invalid',
        event: 'Staff session expired',
        ticket: 'Please log in again',
        id: refNumber,
      })
      return
    }

    setIsScanning(false)
    setIsVerifying(true)

    try {
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      }

      const checkResponse = await fetch(
        `${API_BASE_URL}/staff/scan/check-ticket/${encodeURIComponent(refNumber)}`,
        { method: 'GET', headers }
      )
      const checkPayload = await checkResponse.json().catch(() => ({}))
      const checkStatus = getPayloadStatus(checkPayload, checkResponse.status)

      if (!checkResponse.ok || checkStatus !== 'valid') {
        showResult(buildResultFromApi(checkPayload, refNumber, checkStatus === 'valid' ? 'invalid' : checkStatus))
        return
      }

      const scanResponse = await fetch(
        `${API_BASE_URL}/staff/scan/ticket/${encodeURIComponent(refNumber)}`,
        { method: 'GET', headers }
      )

      const scanPayload = await scanResponse.json().catch(() => ({}))
      const scanStatus = getPayloadStatus(scanPayload, scanResponse.status)
      showResult(buildResultFromApi(checkPayload, refNumber, scanStatus))
    } catch (error) {
      console.log('Ticket scan error:', error)
      showResult({
        status: 'invalid',
        event: 'Verification failed',
        ticket: 'Could not reach scanner API',
        id: refNumber,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleBarcodeScanned = ({ data }) => {
    if (!data || !isScanning || isVerifying || data === lastScannedValue) return
    setLastScannedValue(data)
    verifyAndScanTicket(data)
  }

  const scanLineAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const resultSlide = useRef(new Animated.Value(300)).current
  const resultOpacity = useRef(new Animated.Value(0)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current
  const cornerGlow = useRef(new Animated.Value(0)).current
  const statsSlide = useRef(new Animated.Value(-30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(statsSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start()
  }, [])

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(Boolean(state.isConnected))
    })
    return () => unsubscribe()
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
      setIsVerifying(false)
      setLastScannedValue(null)
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

  if (!permission) {
    return <View style={styles.root} />
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.permissionWrapper]}>
        <StatusBar barStyle="light-content" backgroundColor="#050A14" />
        <SafeAreaView style={styles.permissionSafeArea}>
          <Header navigation={navigation} />
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>
              Allow camera permission so the app can scan and read ticket QR codes.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
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
        <Header navigation={navigation} />

        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerTitle}>OFFLINE</Text>
            <Text style={styles.offlineBannerText}>Connect to the internet to verify and scan tickets.</Text>
          </View>
        )}

        <Animated.View style={[styles.statsBar]}>
          {[
            { value: successCount, label: 'VALID', color: '#00E5A0' },
            { value: scanCount, label: 'SCANNED', color: '#FFFFFF' },
            { value: scanCount - successCount, label: 'REJECTED', color: '#FF4D6A' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={[styles.statItem, i === 1 && { flex: 2 }]}>
                <Text style={[styles.statNumber, { color: s.color }, i === 1 && { fontSize: 24, fontWeight: '900' }]}>{s.value}</Text>
                <Text style={[styles.statLabel, i === 1 && { color: '#4A8AAF', fontSize: 8 }]}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </Animated.View>

        <View style={styles.scannerArea}>
          <Text style={styles.scanPrompt}>
            {isVerifying ? 'Checking ticket with server...' : isScanning ? 'Point camera at ticket QR code' : 'Processing...'}
          </Text>

          <View style={styles.scannerFrame}>
            {isFocused && (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
              />
            )}

            <View style={styles.cameraShade} />
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
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={() => {
              setLastScannedValue(null)
              setIsScanning(true)
              setIsVerifying(false)
            }}
          >
            <Text style={styles.ctrlIcon}>↺</Text>
            <Text style={styles.ctrlLabel}>RESET</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainScanBtn}
            onPress={() => {
              setLastScannedValue(null)
              setIsScanning(true)
            }}
          >
            <View style={styles.mainScanRing}>
              <View style={styles.mainScanCore}>
                <Text style={styles.mainScanIcon}>◈</Text>
                <Text style={styles.mainScanLabel}>{isVerifying ? 'WAIT' : 'LIVE'}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ctrlBtn} onPress={dismissResult}>
            <Text style={styles.ctrlIcon}>✓</Text>
            <Text style={styles.ctrlLabel}>NEXT</Text>
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

            <View style={styles.resultBody}>
              <View style={styles.resultTopRow}>
                <View style={[
                  styles.resultIconRing,
                  { borderColor: statusConfig?.color, backgroundColor: `${statusConfig?.color}15` },
                ]}>
                  <Text style={[styles.resultIconText, { color: statusConfig?.color }]}>{statusConfig?.icon}</Text>
                </View>

                <View style={styles.resultHeading}>
                  <Text style={[styles.resultStatusLabel, { color: statusConfig?.color }]}>{statusConfig?.label}</Text>
                  {!!resultData?.note && <Text style={styles.resultMetaText}>{resultData.note}</Text>}
                </View>
              </View>

              <Text style={styles.attendeeName}>{resultData?.name}</Text>
              <Text style={styles.eventName}>{resultData?.event}</Text>
              <Text style={styles.resultIdText}>Ticket ID: {resultData?.id}</Text>

              <View style={styles.bodyDivider} />

              <View style={styles.infoGrid}>
                {[
                  { label: 'TICKET TYPE', value: resultData?.ticket },
                  resultData?.scannedAt
                    ? { label: 'FIRST SCANNED', value: resultData.scannedAt, highlight: '#ffffff' }
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
                  {scanResult === 'valid' ? 'ADMIT GUEST  >' : 'SCAN NEXT  >'}
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
  permissionWrapper: { justifyContent: 'center' },
  permissionSafeArea: { flex: 1 },
  permissionCard: {
    marginHorizontal: 20,
    marginTop: 32,
    padding: 24,
    borderRadius: 18,
    backgroundColor: '#0B1623',
    borderWidth: 1,
    borderColor: '#132035',
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  permissionText: {
    color: '#7E97B3',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  permissionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#00C2FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#050A14',
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  offlineBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#3B1118',
    borderWidth: 1,
    borderColor: '#6D2430',
  },
  offlineBannerTitle: {
    color: '#FFD5DB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  offlineBannerText: {
    color: '#FFB7C2',
    fontSize: 12,
  },

  // Stats
  statsBar: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#0B1623', borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#00C2FF',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { color: '#2E4A62', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#00C2FF', marginVertical: 6 },

  // Scanner
  scannerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanPrompt: { color: '#3D6080', fontSize: 12, letterSpacing: 1, marginBottom: 20, fontWeight: '500' },

  scannerFrame: {
    width: SCANNER_SIZE, height: SCANNER_SIZE,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#09111D',
    borderRadius: 22,
  },
  cameraShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,10,20,0.14)',
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

  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  resultHeading: { flex: 1 },
  resultIconRing: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  resultIconText: { fontSize: 20, fontWeight: '800' },
  resultStatusLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  resultMetaText: { color: '#7E97B3', fontSize: 11, marginTop: 4 },
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