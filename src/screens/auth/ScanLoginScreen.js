import {
    StyleSheet, Text, View, TouchableOpacity,
    Animated, Dimensions, StatusBar
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')
const SCANNER_SIZE = width * 0.68

export default function ScanLoginScreen({ navigation }) {
    const [scanState, setScanState] = useState('idle') // idle | scanning | success | error
    const [showManual, setShowManual] = useState(false)

    // Animations
    const scanLineAnim = useRef(new Animated.Value(0)).current
    const pulseAnim = useRef(new Animated.Value(1)).current
    const cornerGlow = useRef(new Animated.Value(0.4)).current
    const fadeIn = useRef(new Animated.Value(0)).current
    const logoSlide = useRef(new Animated.Value(-20)).current
    const cardSlide = useRef(new Animated.Value(40)).current
    const resultScale = useRef(new Animated.Value(0.85)).current
    const resultOpacity = useRef(new Animated.Value(0)).current
    const shimmerAnim = useRef(new Animated.Value(0)).current

    // Entrance
    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.parallel([
                Animated.spring(logoSlide, { toValue: 0, friction: 7, tension: 70, useNativeDriver: true }),
                Animated.spring(cardSlide, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
            ]),
        ]).start()
    }, [])

    // Scan line + glow loop
    useEffect(() => {
        if (scanState !== 'scanning') return

        const line = Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
                Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
            ])
        )
        line.start()

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        )
        pulse.start()

        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(cornerGlow, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(cornerGlow, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
            ])
        )
        glow.start()

        return () => { line.stop(); pulse.stop(); glow.stop() }
    }, [scanState])

    // Shimmer on idle
    useEffect(() => {
        const shimmer = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        )
        shimmer.start()
        return () => shimmer.stop()
    }, [])

    const startScan = () => {
        setScanState('scanning')
        pulseAnim.setValue(1)
        scanLineAnim.setValue(0)
    }

    const mockScanSuccess = () => {
        setScanState('success')
        Animated.parallel([
            Animated.spring(resultScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
            Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start()
        setTimeout(() => navigation?.navigate?.('Scanner'), 1800)
    }

    const mockScanError = () => {
        setScanState('error')
        Animated.parallel([
            Animated.spring(resultScale, { toValue: 1, friction: 6, useNativeDriver: true }),
            Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start()
    }

    const resetScan = () => {
        setScanState('idle')
        resultScale.setValue(0.85)
        resultOpacity.setValue(0)
        scanLineAnim.setValue(0)
        pulseAnim.setValue(1)
        cornerGlow.setValue(0.4)
    }

    const scanLineY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, SCANNER_SIZE - 4],
    })

    const shimmerOpacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.03, 0.09],
    })

    const isScanning = scanState === 'scanning'
    const isSuccess = scanState === 'success'
    const isError = scanState === 'error'
    const isIdle = scanState === 'idle'

    const frameColor = isSuccess ? '#00E5A0' : isError ? '#FF4D6A' : '#00C2FF'

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#050A14" />

            {/* Background */}
            <View style={styles.bgOrb1} />
            <View style={styles.bgOrb2} />
            <View style={styles.bgOrb3} />
            {[...Array(7)].map((_, i) => (
                <View key={i} style={[styles.gridLine, { top: (height / 7) * i }]} />
            ))}
            {[...Array(5)].map((_, i) => (
                <View key={i} style={[styles.gridLineV, { left: (width / 5) * i }]} />
            ))}

            <SafeAreaView style={styles.safeArea}>

                {/* ── Logo ── */}
                <Animated.View style={[
                    styles.logoSection,
                    { opacity: fadeIn, transform: [{ translateY: logoSlide }] }
                ]}>
                    <View style={styles.logoIcon}>
                        {/* Scan bracket icon */}
                        <View style={styles.iconBracketTL} />
                        <View style={styles.iconBracketTR} />
                        <View style={styles.iconBracketBL} />
                        <View style={styles.iconBracketBR} />
                        <View style={styles.iconScanDash} />
                    </View>
                    <View style={styles.logoTextRow}>
                        <Text style={styles.logoMedia}>MediaOne</Text>
                        <Text style={styles.logoTix}>Tix</Text>
                    </View>
                    <Text style={styles.logoSub}>SCANNER PORTAL</Text>
                </Animated.View>

                {/* ── Main Card ── */}
                <Animated.View style={[
                    styles.card,
                    { opacity: fadeIn, transform: [{ translateY: cardSlide }] }
                ]}>
                    {/* Card heading */}
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>QR Login</Text>
                        <Text style={styles.cardSub}>
                            {isIdle ? 'Scan your staff access QR code to sign in' : ''}
                            {isScanning ? 'Align QR code within the frame...' : ''}
                            {isSuccess ? 'Identity verified — redirecting...' : ''}
                            {isError ? 'QR code not recognized. Try again.' : ''}
                        </Text>
                    </View>

                    {/* ── Scanner Frame ── */}
                    <View style={styles.frameWrap}>
                        {/* Ambient glow behind frame */}
                        <Animated.View style={[
                            styles.frameGlow,
                            {
                                opacity: isScanning ? cornerGlow : shimmerOpacity,
                                backgroundColor: frameColor,
                            }
                        ]} />

                        <Animated.View style={[
                            styles.frame,
                            { transform: [{ scale: isScanning ? pulseAnim : 1 }] }
                        ]}>
                            {/* Corners */}
                            {[
                                [styles.cTL, { borderTopWidth: 3, borderLeftWidth: 3 }],
                                [styles.cTR, { borderTopWidth: 3, borderRightWidth: 3 }],
                                [styles.cBL, { borderBottomWidth: 3, borderLeftWidth: 3 }],
                                [styles.cBR, { borderBottomWidth: 3, borderRightWidth: 3 }],
                            ].map(([pos, border], i) => (
                                <Animated.View key={i} style={[
                                    styles.corner, pos, border,
                                    { borderColor: frameColor, opacity: isScanning ? cornerGlow : 0.6 }
                                ]} />
                            ))}

                            {/* Inner corner dots */}
                            <View style={[styles.cDot, { top: 12, left: 12 }]} />
                            <View style={[styles.cDot, { top: 12, right: 12 }]} />
                            <View style={[styles.cDot, { bottom: 12, left: 12 }]} />
                            <View style={[styles.cDot, { bottom: 12, right: 12 }]} />

                            {/* Scan line */}
                            {isScanning && (
                                <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}>
                                    <View style={[styles.scanBar, { backgroundColor: frameColor }]} />
                                    <View style={[styles.scanGlow, { backgroundColor: frameColor }]} />
                                </Animated.View>
                            )}

                            {/* States inside frame */}
                            {isIdle && (
                                <View style={styles.idleContent}>
                                    {/* QR code illustration */}
                                    <View style={styles.qrIllustration}>
                                        {/* Top-left finder */}
                                        <View style={[styles.qrFinder, { top: 0, left: 0 }]}>
                                            <View style={styles.qrFinderInner} />
                                        </View>
                                        {/* Top-right finder */}
                                        <View style={[styles.qrFinder, { top: 0, right: 0 }]}>
                                            <View style={styles.qrFinderInner} />
                                        </View>
                                        {/* Bottom-left finder */}
                                        <View style={[styles.qrFinder, { bottom: 0, left: 0 }]}>
                                            <View style={styles.qrFinderInner} />
                                        </View>
                                        {/* Data dots */}
                                        {[
                                            [38, 14], [46, 14], [54, 14],
                                            [38, 22], [54, 22],
                                            [14, 38], [22, 38], [30, 38],
                                            [46, 38], [54, 38],
                                            [14, 46], [30, 46], [38, 46],
                                            [22, 54], [46, 54], [54, 54],
                                        ].map(([l, t], i) => (
                                            <View key={i} style={[styles.qrDot, { left: l, top: t }]} />
                                        ))}
                                    </View>
                                    <Text style={styles.idleHint}>Tap below to activate camera</Text>
                                </View>
                            )}

                            {isScanning && (
                                <View style={styles.scanningContent}>
                                    {/* Crosshair */}
                                    <View style={styles.crossH} />
                                    <View style={styles.crossV} />
                                    <View style={styles.crossDot} />
                                </View>
                            )}

                            {isSuccess && (
                                <Animated.View style={[
                                    styles.resultContent,
                                    { transform: [{ scale: resultScale }], opacity: resultOpacity }
                                ]}>
                                    <View style={[styles.resultCircle, { borderColor: '#00E5A0', backgroundColor: '#001A12' }]}>
                                        <Text style={[styles.resultIconLarge, { color: '#00E5A0' }]}>✓</Text>
                                    </View>
                                    <Text style={[styles.resultLabel, { color: '#00E5A0' }]}>VERIFIED</Text>
                                    <Text style={styles.resultName}>Staff · Gate A</Text>
                                </Animated.View>
                            )}

                            {isError && (
                                <Animated.View style={[
                                    styles.resultContent,
                                    { transform: [{ scale: resultScale }], opacity: resultOpacity }
                                ]}>
                                    <View style={[styles.resultCircle, { borderColor: '#FF4D6A', backgroundColor: '#1A0008' }]}>
                                        <Text style={[styles.resultIconLarge, { color: '#FF4D6A' }]}>✕</Text>
                                    </View>
                                    <Text style={[styles.resultLabel, { color: '#FF4D6A' }]}>UNRECOGNIZED</Text>
                                    <Text style={styles.resultName}>QR code invalid</Text>
                                </Animated.View>
                            )}
                        </Animated.View>

                        {/* Frame label tabs */}
                        <View style={styles.frameTabTop}>
                            <Text style={styles.frameTabText}>STAFF ACCESS</Text>
                        </View>
                        <View style={styles.frameTabBottom}>
                            <View style={[styles.frameTabDot, { backgroundColor: frameColor }]} />
                            <Text style={[styles.frameTabText, { color: frameColor }]}>
                                {isIdle ? 'READY' : isScanning ? 'SCANNING' : isSuccess ? 'AUTHENTICATED' : 'FAILED'}
                            </Text>
                        </View>
                    </View>

                    {/* ── Action Buttons ── */}
                    <View style={styles.actions}>
                        {(isIdle || isError) && (
                            <TouchableOpacity style={styles.scanBtn} onPress={startScan} activeOpacity={0.85}>
                                <View style={styles.scanBtnInner}>
                                    <Text style={styles.scanBtnIcon}>◈</Text>
                                    <Text style={styles.scanBtnText}>
                                        {isError ? 'TRY AGAIN' : 'ACTIVATE SCANNER'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {isScanning && (
                            <View style={styles.scanningActions}>
                                <TouchableOpacity style={styles.mockValidBtn} onPress={mockScanSuccess} activeOpacity={0.85}>
                                    <Text style={styles.mockValidText}>✓  Simulate Valid QR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.mockInvalidBtn} onPress={mockScanError} activeOpacity={0.85}>
                                    <Text style={styles.mockInvalidText}>✕  Simulate Invalid</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelScanBtn} onPress={resetScan}>
                                    <Text style={styles.cancelScanText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {isSuccess && (
                            <View style={styles.successMsg}>
                                <View style={styles.successDot} />
                                <Text style={styles.successText}>Signing you in...</Text>
                            </View>
                        )}

                        {isError && (
                            <TouchableOpacity style={styles.backLoginBtn} onPress={() => navigation?.navigate?.('Login')}>
                                <Text style={styles.backLoginText}>Back to Password Login</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>

                {/* ── Footer ── */}
                <Animated.View style={[styles.footer, { opacity: fadeIn }]}>
                    <TouchableOpacity onPress={() => navigation?.navigate?.('Login')}>
                        <Text style={styles.footerText}>
                            Prefer password login?  <Text style={styles.footerLink}>Sign in here</Text>
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050A14' },

    bgOrb1: {
        position: 'absolute', width: 360, height: 360, borderRadius: 180,
        backgroundColor: '#00C2FF', top: -140, right: -120, opacity: 0.04,
    },
    bgOrb2: {
        position: 'absolute', width: 260, height: 260, borderRadius: 130,
        backgroundColor: '#00E5A0', bottom: 40, left: -100, opacity: 0.04,
    },
    bgOrb3: {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        backgroundColor: '#00C2FF', top: height * 0.45, right: -50, opacity: 0.03,
    },
    gridLine: {
        position: 'absolute', left: 0, right: 0, height: 1,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    gridLineV: {
        position: 'absolute', top: 0, bottom: 0, width: 1,
        backgroundColor: 'rgba(255,255,255,0.015)',
    },

    safeArea: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24 },

    // Logo
    logoSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
    logoIcon: {
        width: 56, height: 56, position: 'relative',
        alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    iconBracketTL: {
        position: 'absolute', top: 0, left: 0, width: 18, height: 18,
        borderTopWidth: 2.5, borderLeftWidth: 2.5,
        borderColor: '#00C2FF', borderTopLeftRadius: 4,
    },
    iconBracketTR: {
        position: 'absolute', top: 0, right: 0, width: 18, height: 18,
        borderTopWidth: 2.5, borderRightWidth: 2.5,
        borderColor: '#00C2FF', borderTopRightRadius: 4,
    },
    iconBracketBL: {
        position: 'absolute', bottom: 0, left: 0, width: 18, height: 18,
        borderBottomWidth: 2.5, borderLeftWidth: 2.5,
        borderColor: '#00C2FF', borderBottomLeftRadius: 4,
    },
    iconBracketBR: {
        position: 'absolute', bottom: 0, right: 0, width: 18, height: 18,
        borderBottomWidth: 2.5, borderRightWidth: 2.5,
        borderColor: '#00C2FF', borderBottomRightRadius: 4,
    },
    iconScanDash: {
        width: 24, height: 2, borderRadius: 1,
        backgroundColor: '#FF6B35', opacity: 0.9,
    },
    logoTextRow: { flexDirection: 'row', alignItems: 'baseline' },
    logoMedia: { color: '#FFFFFF', fontSize: 26, fontWeight: '600' },
    logoTix: { color: '#00C2FF', fontSize: 26, fontWeight: '800' },
    logoSub: { color: '#2E4A62', fontSize: 9, letterSpacing: 3.5, fontWeight: '700', marginTop: 5 },

    // Card
    card: {
        backgroundColor: '#0B1623', borderRadius: 24,
        borderWidth: 1, borderColor: '#132035',
        padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5, shadowRadius: 24, elevation: 14,
    },
    cardHeader: { marginBottom: 22 },
    cardTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
    cardSub: { color: '#3D6080', fontSize: 13, marginTop: 4, lineHeight: 18 },

    // Frame
    frameWrap: { alignItems: 'center', marginBottom: 24, position: 'relative' },
    frameGlow: {
        position: 'absolute',
        width: SCANNER_SIZE + 60, height: SCANNER_SIZE + 60,
        borderRadius: (SCANNER_SIZE + 60) / 2,
        alignSelf: 'center',
        top: -30,
    },
    frame: {
        width: SCANNER_SIZE, height: SCANNER_SIZE,
        backgroundColor: '#071020',
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#0F2035',
    },

    corner: { position: 'absolute', width: 26, height: 26 },
    cTL: { top: 0, left: 0, borderTopLeftRadius: 4 },
    cTR: { top: 0, right: 0, borderTopRightRadius: 4 },
    cBL: { bottom: 0, left: 0, borderBottomLeftRadius: 4 },
    cBR: { bottom: 0, right: 0, borderBottomRightRadius: 4 },
    cDot: {
        position: 'absolute', width: 4, height: 4,
        borderRadius: 2, backgroundColor: '#00C2FF', opacity: 0.4,
    },

    scanLine: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 10 },
    scanBar: { height: 2, opacity: 0.9 },
    scanGlow: { height: 18, marginTop: -10, opacity: 0.08, borderRadius: 9 },

    // Frame tabs
    frameTabTop: {
        position: 'absolute', top: -10,
        backgroundColor: '#0B1623', paddingHorizontal: 10, paddingVertical: 2,
        borderRadius: 6, borderWidth: 1, borderColor: '#132035',
    },
    frameTabBottom: {
        position: 'absolute', bottom: -10,
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#0B1623', paddingHorizontal: 10, paddingVertical: 2,
        borderRadius: 6, borderWidth: 1, borderColor: '#132035',
    },
    frameTabText: { color: '#2E4A62', fontSize: 8, fontWeight: '700', letterSpacing: 2 },
    frameTabDot: { width: 5, height: 5, borderRadius: 3 },

    // Idle state
    idleContent: { alignItems: 'center', gap: 16 },
    qrIllustration: { width: 70, height: 70, position: 'relative' },
    qrFinder: {
        position: 'absolute', width: 20, height: 20,
        borderWidth: 2.5, borderColor: 'rgba(0,194,255,0.5)', borderRadius: 3,
        alignItems: 'center', justifyContent: 'center',
    },
    qrFinderInner: {
        width: 8, height: 8, backgroundColor: 'rgba(0,194,255,0.3)', borderRadius: 1,
    },
    qrDot: { position: 'absolute', width: 5, height: 5, borderRadius: 1, backgroundColor: 'rgba(0,194,255,0.35)' },
    idleHint: { color: '#2E4A62', fontSize: 10, letterSpacing: 1, textAlign: 'center' },

    // Scanning state
    scanningContent: { alignItems: 'center', justifyContent: 'center' },
    crossH: { width: 28, height: 1.5, backgroundColor: 'rgba(0,194,255,0.5)', position: 'absolute' },
    crossV: { width: 1.5, height: 28, backgroundColor: 'rgba(0,194,255,0.5)', position: 'absolute' },
    crossDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: '#00C2FF', position: 'absolute', opacity: 0.8,
    },

    // Result state
    resultContent: { alignItems: 'center', gap: 10 },
    resultCircle: {
        width: 72, height: 72, borderRadius: 36,
        borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
    },
    resultIconLarge: { fontSize: 30, fontWeight: '800' },
    resultLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 3 },
    resultName: { color: '#4A6080', fontSize: 12, fontWeight: '500' },

    // Actions
    actions: { gap: 12 },
    scanBtn: {
        borderRadius: 14, backgroundColor: '#00C2FF', overflow: 'hidden',
        shadowColor: '#00C2FF', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
    },
    scanBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, gap: 10,
    },
    scanBtnIcon: { fontSize: 18, color: '#050A14' },
    scanBtnText: { color: '#050A14', fontSize: 13, fontWeight: '900', letterSpacing: 2 },

    scanningActions: { gap: 10 },
    mockValidBtn: {
        borderRadius: 12, backgroundColor: '#001A12',
        borderWidth: 1, borderColor: '#00E5A0',
        paddingVertical: 14, alignItems: 'center',
    },
    mockValidText: { color: '#00E5A0', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    mockInvalidBtn: {
        borderRadius: 12, backgroundColor: '#1A0008',
        borderWidth: 1, borderColor: '#FF4D6A',
        paddingVertical: 14, alignItems: 'center',
    },
    mockInvalidText: { color: '#FF4D6A', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    cancelScanBtn: { alignItems: 'center', paddingVertical: 8 },
    cancelScanText: { color: '#2E4A62', fontSize: 13, fontWeight: '500' },

    successMsg: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14,
        backgroundColor: '#001A12', borderRadius: 12, borderWidth: 1, borderColor: '#00E5A080',
    },
    successDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E5A0' },
    successText: { color: '#00E5A0', fontSize: 13, fontWeight: '600', letterSpacing: 1 },

    backLoginBtn: { alignItems: 'center', paddingVertical: 8 },
    backLoginText: { color: '#3D6080', fontSize: 13, fontWeight: '500' },

    // Footer
    footer: { alignItems: 'center', paddingBottom: 16 },
    footerText: { color: '#2E4A62', fontSize: 13 },
    footerLink: { color: '#00C2FF', fontWeight: '600' },
});