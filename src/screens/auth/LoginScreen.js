import { StyleSheet, Text, View, TextInput, TouchableOpacity, Dimensions, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../../context/AuthContext';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window')

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, userInfo } = React.useContext(AuthContext);
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current
  const logoScale = useRef(new Animated.Value(0.8)).current
  const card1Anim = useRef(new Animated.Value(60)).current
  const card2Anim = useRef(new Animated.Value(80)).current
  const card3Anim = useRef(new Animated.Value(100)).current
  const [showPassword, setShowPassword] = useState(false)

  // Memoize callbacks to prevent re-renders
  const handleEmailChange = useCallback((text) => {
    setEmail(text)
  }, [])

  const handlePasswordChange = useCallback((text) => {
    setPassword(text)
  }, [])

  const handleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const handleLogin = useCallback(() => {
    login(email, password)
  }, [email, password, login])

  const handleNavigateToScan = useCallback(() => {
    navigation.navigate("ScanLogin")
  }, [navigation])

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]),
      Animated.stagger(80, [
        Animated.spring(card1Anim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.spring(card2Anim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.spring(card3Anim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}
      >
        {/* Background decorative elements */}
        <View style={styles.bgDecor1} />
        <View style={styles.bgDecor2} />
        <View style={styles.bgDecor3} />

        {/* Floating ticket stubs */}
        <View style={[styles.ticketStub, styles.ticketStub1]}>
          <View style={styles.stubLine} />
          <View style={styles.stubLine} />
          <View style={[styles.stubLine, { width: 24 }]} />
        </View>
        <View style={[styles.ticketStub, styles.ticketStub2]}>
          <View style={styles.stubLine} />
          <View style={[styles.stubLine, { width: 28 }]} />
          <View style={styles.stubLine} />
        </View>

        <View style={styles.container}>
          {/* Logo Section */}
          <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoIconWrap}>
              {/* QR/scan icon made from native elements */}
              <View style={styles.scanIcon}>
                <View style={styles.scanCornerTL} />
                <View style={styles.scanCornerTR} />
                <View style={styles.scanCornerBL} />
                <View style={styles.scanCornerBR} />
                <View style={styles.scanLine} />
                <View style={styles.scanDot} />
              </View>
            </View>
            <Text style={styles.logoText}>
              <Text style={styles.logoMedia}>MediaOne</Text>
              <Text style={styles.logoTix}>Tix</Text>
            </Text>
            <Text style={styles.tagline}>EVENT TICKETING SCANNER</Text>
          </Animated.View>

          {/* Card */}
          <View style={styles.card}>
            <Animated.View style={{ transform: [{ translateY: card1Anim }], opacity: fadeAnim }}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.subText}>Sign in to continue scanning</Text>
            </Animated.View>

            {/* Email Input */}
            <View style={styles.inputGroupContainer}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  ref={emailRef}
                  editable={true}
                  style={styles.input}
                  placeholder="you@mediaone.com"
                  placeholderTextColor="#4A5568"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={handleEmailChange}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroupContainer}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>⬅</Text>
                <TextInput
                  ref={passwordRef}
                  editable={true}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#4A5568"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={handlePasswordChange}
                />
                <TouchableOpacity onPress={handleShowPassword} style={styles.eyeBtn}>
                  {showPassword ? (
                    <MaterialCommunityIcons name="eye" color="#00C2FF" size={24} />
                  ) : (
                    <Ionicons name="eye-off" color="#00C2FF" size={24} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <Animated.View style={[styles.forgotRow, { transform: [{ translateY: card2Anim }], opacity: fadeAnim }]}>
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Login Button */}
            <Animated.View style={{ transform: [{ translateY: card3Anim }], opacity: fadeAnim }}>
              <TouchableOpacity
                style={styles.loginBtn}
                activeOpacity={0.85}
                onPress={handleLogin}>
                <View style={styles.loginBtnInner}>
                  <Text style={styles.loginBtnText}>SIGN IN</Text>
                  <Text style={styles.loginBtnArrow}>→</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <Animated.View style={[styles.divider, { opacity: fadeAnim }]}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* SSO Button */}
            <Animated.View style={{ transform: [{ translateY: card3Anim }], opacity: fadeAnim }}>
              <TouchableOpacity
                onPress={handleNavigateToScan}
                style={styles.ssoBtn} activeOpacity={0.85}>
                <Text style={styles.ssoBtnText}>Continue with QR</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>
              New to MediaOneTix?{' '}
              <Text style={styles.footerLink}>Request Access</Text>
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050A14',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  // Background decorative orbs
  bgDecor1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#0D2E5C',
    top: -80,
    right: -80,
    opacity: 0.5,
  },
  bgDecor2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00C2FF',
    bottom: 60,
    left: -100,
    opacity: 0.04,
  },
  bgDecor3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B35',
    top: height * 0.35,
    right: -40,
    opacity: 0.06,
  },

  // Ticket stub decorations
  ticketStub: {
    position: 'absolute',
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  ticketStub1: { top: 80, right: 28, transform: [{ rotate: '12deg' }] },
  ticketStub2: { bottom: 120, left: 20, transform: [{ rotate: '-8deg' }] },
  stubLine: {
    height: 2,
    width: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginVertical: 2,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#0D1E3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A3A6A',
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  scanIcon: {
    width: 36,
    height: 36,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: 10, height: 10,
    borderTopWidth: 2.5, borderLeftWidth: 2.5,
    borderColor: '#00C2FF', borderTopLeftRadius: 2,
  },
  scanCornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: 10, height: 10,
    borderTopWidth: 2.5, borderRightWidth: 2.5,
    borderColor: '#00C2FF', borderTopRightRadius: 2,
  },
  scanCornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: 10, height: 10,
    borderBottomWidth: 2.5, borderLeftWidth: 2.5,
    borderColor: '#00C2FF', borderBottomLeftRadius: 2,
  },
  scanCornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10,
    borderBottomWidth: 2.5, borderRightWidth: 2.5,
    borderColor: '#00C2FF', borderBottomRightRadius: 2,
  },
  scanLine: {
    width: 22,
    height: 1.5,
    backgroundColor: '#FF6B35',
    borderRadius: 1,
  },
  scanDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00C2FF',
    top: 7,
    right: 7,
  },
  logoText: {
    fontSize: 30,
    letterSpacing: -0.5,
    fontWeight: '300',
  },
  logoMedia: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logoTix: {
    color: '#00C2FF',
    fontWeight: '800',
  },
  tagline: {
    fontSize: 10,
    color: '#3D6080',
    letterSpacing: 3,
    marginTop: 6,
    fontWeight: '600',
  },

  // Card
  card: {
    backgroundColor: '#0B1623',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#132035',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  welcomeText: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: '#4A6080',
    marginBottom: 28,
    fontWeight: '400',
  },

  // Inputs
  inputGroupContainer: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    color: '#3D6080',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071020',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#132035',
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapFocused: {
    borderColor: '#00C2FF',
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    fontSize: 13,
    color: '#3D6080',
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '400',
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 14,
    color: '#3D6080',
  },

  // Forgot
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    color: '#00C2FF',
    fontSize: 13,
    fontWeight: '500',
  },

  // Login button
  loginBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#00C2FF',
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  loginBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  loginBtnText: {
    color: '#050A14',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  loginBtnArrow: {
    color: '#050A14',
    fontSize: 18,
    fontWeight: '700',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#132035',
  },
  dividerText: {
    color: '#3D6080',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // SSO
  ssoBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1A3A5C',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  ssoBtnText: {
    color: '#6A9ABF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#3D6080',
    fontSize: 13,
  },
  footerLink: {
    color: '#00C2FF',
    fontWeight: '600',
  },
});