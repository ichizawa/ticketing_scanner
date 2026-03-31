import {
    StyleSheet, Text, View, TouchableOpacity, ScrollView,
    TextInput, Animated, Dimensions, StatusBar, Image, Alert, Platform,
    FlatList, Modal
} from 'react-native'
import { Entypo, MaterialIcons } from '@expo/vector-icons'
import React, { useState, useRef, useEffect, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../../context/AuthContext'
import Header from '../../components/Header'

const { width, height } = Dimensions.get('window')

// Helper to format HH:mm:ss to h:mm AM/PM
const formatTime = (time) => {
    if (!time) return 'TBA';
    try {
        const parts = time.split(':');
        if (parts.length < 2) return time;
        let h = parseInt(parts[0], 10);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    } catch (e) {
        return time;
    }
};

// --- Mock Data ---
const ARTISTS = [
    { id: 1, name: 'Illenium', role: 'Headliner', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400', bio: 'Nick Miller, known professionally as Illenium, is an American musician, DJ, and record producer. Known for his melodic bass music and emotional live shows.' },
    { id: 2, name: 'Said The Sky', role: 'Direct Support', image: 'https://images.unsplash.com/photo-1514525253361-bee8a48790c3?auto=format&fit=crop&q=80&w=400', bio: 'Trevor Christensen, known as Said The Sky, is an American electronic dance music producer and DJ. His live sets feature pianos and acoustic instruments.' },
    { id: 3, name: 'Dabin', role: 'Opening Act', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400', bio: 'Dabin Lee is a Canadian electronic music producer and instrumentalist. He is known for incorporating live guitar into his shows.' },
];

const TIERS = [
    { id: 'svip', name: 'SVIP Reserved', price: 12500, type: 'Reserved Seating', availability: '10 Seats Left', perks: 'Soundcheck Access, Commemorative Lanyard, Signed Poster', color: '#a7d2fa' },
    { id: 'gold', name: 'Gold Standing', price: 7500, type: 'Standing Room', availability: 'Selling Fast', perks: 'Early Floor Entry, Floor Priority Access', color: '#FFD700' },
    { id: 'silver', name: 'Silver GA', price: 3500, type: 'General Admission', availability: 'Available', perks: 'Standard Entry, Upper Tier Access', color: '#E5E4E2' },
    { id: 'bronze', name: 'Bronze GA', price: 2000, type: 'General Admission', availability: 'Sold Out', perks: 'Standard Entry', color: '#B87333' }
];

const SEAT_MAP_URL = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800';

export default function PurchaseScreen({ navigation, route }) {
    const { logout } = useContext(AuthContext);
    const { event } = route.params || {};

    const [step, setStep] = useState(0);
    const [expandedArtist, setExpandedArtist] = useState(null);
    const [aboutExpanded, setAboutExpanded] = useState(false);
    const [isMapVisible, setIsMapVisible] = useState(false);

    // Initial event data from params or defaults
    const displayEvent = {
        title: event?.title || event?.event_name || 'ASCENSION MUSIC FESTIVAL',
        banner: event?.image || event?.event_image || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
        date: event?.date || event?.event_date || 'MAR 28',
        time: event?.time || event?.event_time || '17:00:00',
        venue: event?.venue || event?.event_venue || 'Philippine Arena',
        category: event?.category || 'Music Festival'
    };

    // Multi-Tier Ticket Selection
    const [selectedTickets, setSelectedTickets] = useState({
        svip: 0,
        gold: 0,
        silver: 0,
        bronze: 0
    });
    const [activeTierId, setActiveTierId] = useState(null);

    // Guest Info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Payment Info
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [promoCode, setPromoCode] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [step]);

    const transitionTo = (nextStep) => {
        fadeAnim.setValue(0);
        setStep(nextStep);
    };

    const handleNext = () => {
        if (step === 0) transitionTo(1);
        else if (step === 1) {
            if (!name || !email) {
                Alert.alert('Incomplete Info', 'Please provide your name and email.');
                return;
            }
            transitionTo(2);
        }
        else if (step === 2) transitionTo(3);
        else if (step === 3) {
            if (selectedPayment === 'gcash' && (!phone || !otp)) {
                Alert.alert('Error', 'Please enter your phone number and OTP.');
                return;
            }
            if (selectedPayment === 'card' && (!cardNumber || !expiry || !cvv)) {
                Alert.alert('Error', 'Please fill in all card details.');
                return;
            }
            transitionTo(4);
        }
    };

    const handleBack = () => {
        if (step > 0 && step < 4) transitionTo(step - 1);
        else if (step === 0) navigation.goBack();
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() }
        ]);
    };

    const updateTicketQty = (id, delta) => {
        setSelectedTickets(prev => ({
            ...prev,
            [id]: Math.max(0, Math.min(10, prev[id] + delta))
        }));
    };

    const getTotalQty = () => Object.values(selectedTickets).reduce((a, b) => a + b, 0);

    const calculateTotal = () => {
        return TIERS.reduce((total, tier) => {
            return total + (tier.price * selectedTickets[tier.id]);
        }, 0);
    };

    const getSelectedItems = () => {
        return TIERS.filter(t => selectedTickets[t.id] > 0);
    };

    // --- Sub-renderers ---

    const renderHeader = () => (
        <Header navigation={navigation} />
    );

    const renderArtistCard = ({ item }) => {
        const isExpanded = expandedArtist === item.id;
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.artistCard}
                onPress={() => setExpandedArtist(isExpanded ? null : item.id)}
            >
                <Image source={{ uri: item.image }} style={styles.artistPhoto} />
                <View style={[styles.artistInfoBar, isExpanded && { backgroundColor: 'rgba(5, 10, 20, 0.95)' }]}>
                    <Text style={styles.artistName}>{item.name}</Text>
                    <Text style={styles.artistRole}>{item.role}</Text>
                    {isExpanded && (
                        <Text style={styles.artistBioTextSmall}>{item.bio}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderStep0 = () => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Event Header */}
            <View style={styles.banner}>
                <Image
                    source={{ uri: displayEvent.banner }}
                    style={styles.bannerImage}
                />
                <View style={[styles.bannerOverlay, { backgroundColor: 'rgba(5, 10, 20, 0.7)' }]} />
                <View style={styles.bannerContent}>
                    <View style={styles.categoryTag}><Text style={styles.categoryTagText}>{displayEvent.category.toUpperCase()}</Text></View>
                    <Text style={styles.eventTitle}>{displayEvent.title}</Text>
                    <View style={styles.eventMetaContainer}>
                        <View style={styles.metaBadgeLight}>
                            <MaterialIcons name="date-range" color="#000" size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.metaTextDark}>{displayEvent.date} · {formatTime(displayEvent.time)}</Text>
                        </View>
                        <View style={styles.metaBadgeLight}>
                            <Entypo name="location-pin" color="#000" size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.metaTextDark}>{displayEvent.venue}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Line-up Gallery */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>LINE-UP</Text>
            </View>
            <FlatList
                data={ARTISTS}
                horizontal
                renderItem={renderArtistCard}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.artistList}
                showsHorizontalScrollIndicator={false}
            />

            {/* About Section */}
            <View style={styles.aboutContainer}>
                <Text style={styles.aboutText}>
                    Join the ultimate melodic bass experience at Ascension Music Festival.
                    Featuring world-class production and emotional journeys through sound.
                </Text>

                <TouchableOpacity
                    style={styles.expandBtn}
                    onPress={() => setAboutExpanded(!aboutExpanded)}
                >
                    <Text style={styles.expandBtnText}>
                        {aboutExpanded ? 'Show Less' : 'Show Guidelines & Restrictions'}
                    </Text>
                    <View style={[styles.arrowIcon, aboutExpanded && styles.arrowRotated]} />
                </TouchableOpacity>

                {aboutExpanded && (
                    <View style={styles.expandedContent}>
                        <Text style={styles.guidelineText}>• Age limit: 16+ (Must be accompanied by adult)</Text>
                        <Text style={styles.guidelineText}>• Prohibited Items: Professional cameras, aerosols, illegal substances.</Text>
                        <Text style={styles.guidelineText}>• Re-entry: Not allowed once ticket is scanned.</Text>
                        <Text style={styles.guidelineText}>• Dress Code: Festival attire encouraged; no sharp accessories.</Text>
                    </View>
                )}
            </View>

            {/* Seating Chart */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SEATING PLAN</Text>
            </View>
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.seatMapCard}
                onPress={() => setIsMapVisible(true)}
            >
                <Image source={{ uri: SEAT_MAP_URL }} style={styles.seatMapImage} />
            </TouchableOpacity>

            {/* Tier Selection */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SELECT TICKETS</Text>
            </View>
            {TIERS.map(tier => (
                <TouchableOpacity
                    key={tier.id}
                    activeOpacity={0.9}
                    onPress={() => setActiveTierId(activeTierId === tier.id ? null : tier.id)}
                    style={[
                        styles.tierCard,
                        selectedTickets[tier.id] > 0 && { backgroundColor: tier.color + '05' },
                        activeTierId === tier.id ? { borderWidth: 2, borderColor: tier.color } : { borderColor: '#132035' }
                    ]}
                >
                    <View style={styles.tierHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.tierName}>{tier.name}</Text>
                            <Text style={styles.tierType}>{tier.type}</Text>
                            <View style={styles.availTagRow}>
                                <View style={[styles.availDot, { backgroundColor: tier.availability === 'Available' ? '#00E5A0' : '#FF5733' }]} />
                                <Text style={styles.availText}>{tier.availability}</Text>
                            </View>
                        </View>
                        <View style={styles.tierPriceControl}>
                            <Text style={[styles.tierPrice, { color: tier.color }]}>₱{tier.price.toLocaleString()}</Text>

                            {/* In-Card Quantity Selector - ONLY show for active tier */}
                            {activeTierId === tier.id && (
                                <View style={styles.tierQtyAction}>
                                    <TouchableOpacity
                                        style={styles.minQtyBtn}
                                        onPress={() => updateTicketQty(tier.id, -1)}
                                    >
                                        <Text style={styles.minQtyText}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.tierQtyValue}>{selectedTickets[tier.id]}</Text>
                                    <TouchableOpacity
                                        style={styles.plusQtyBtn}
                                        onPress={() => updateTicketQty(tier.id, 1)}
                                    >
                                        <Text style={styles.plusQtyText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {activeTierId !== tier.id && selectedTickets[tier.id] > 0 && (
                                <View style={styles.qtyBadge}>
                                    <Text style={styles.qtyBadgeText}>{selectedTickets[tier.id]}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.tierPerksRow}>
                        <View style={styles.perkDot} />
                        <Text style={styles.perkText}>{tier.perks}</Text>
                    </View>
                </TouchableOpacity>
            ))}

            <View style={{ height: 120 }} />
        </ScrollView>
    );

    const renderStep1 = () => (
        <View style={styles.pageContainer}>
            <Text style={styles.pageTitle}>Guest Details</Text>
            <Text style={styles.pageSub}>Simple registration to issue your tickets.</Text>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Juan De La Cruz"
                        placeholderTextColor="#4A5568"
                        value={name}
                        onChangeText={setName}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>EMAIL ADDRESS</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="juan@email.com"
                        placeholderTextColor="#4A5568"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.pageContainer}>
            <Text style={styles.pageTitle}>Confirm Order</Text>
            <Text style={styles.pageSub}>Please review your selection before paying.</Text>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryHeading}>TICKET BREAKDOWN</Text>
                {getSelectedItems().map(tier => (
                    <View key={tier.id} style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{tier.name} (x{selectedTickets[tier.id]})</Text>
                        <Text style={styles.summaryVal}>₱{(tier.price * selectedTickets[tier.id]).toLocaleString()}</Text>
                    </View>
                ))}

                <View style={[styles.divider, { marginVertical: 15 }]} />

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Guest Name</Text>
                    <Text style={styles.summaryVal}>{name}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Guest Email</Text>
                    <Text style={styles.summaryVal}>{email}</Text>
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL DUE</Text>
                    <Text style={styles.totalVal}>₱{calculateTotal().toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.promoWrap}>
                <TextInput
                    style={styles.promoInput}
                    placeholder="Promo Code"
                    placeholderTextColor="#4A5568"
                    value={promoCode}
                    onChangeText={setPromoCode}
                />
                <TouchableOpacity style={styles.applyBtn}>
                    <Text style={styles.applyBtnText}>APPLY</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.pageContainer}>
            <Text style={styles.pageTitle}>Payment</Text>
            <Text style={styles.pageSub}>Secure payment processing via MediaOne Pay.</Text>

            <View style={styles.paymentToggle}>
                <TouchableOpacity
                    style={[styles.toggleBtn, selectedPayment === 'gcash' && styles.toggleActive]}
                    onPress={() => setSelectedPayment('gcash')}
                >
                    <View style={styles.gcashLogo} />
                    <Text style={styles.toggleText}>GCash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, selectedPayment === 'card' && styles.toggleActive]}
                    onPress={() => setSelectedPayment('card')}
                >
                    <View style={styles.cardIcon} />
                    <Text style={styles.toggleText}>Card</Text>
                </TouchableOpacity>
            </View>

            {selectedPayment === 'gcash' && (
                <View style={styles.paymentForm}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>GCASH PHONE NUMBER</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="09XXXXXXXXX"
                            placeholderTextColor="#4A5568"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>OTP CODE</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="6-Digit OTP"
                            placeholderTextColor="#4A5568"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otp}
                            onChangeText={setOtp}
                        />
                    </View>
                </View>
            )}

            {selectedPayment === 'card' && (
                <View style={styles.paymentForm}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>16-DIGIT CARD NUMBER</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0000 0000 0000 0000"
                            placeholderTextColor="#4A5568"
                            keyboardType="numeric"
                            value={cardNumber}
                            onChangeText={setCardNumber}
                        />
                    </View>
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>EXPIRY</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="MM/YY"
                                placeholderTextColor="#4A5568"
                                value={expiry}
                                onChangeText={setExpiry}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 0.6 }]}>
                            <Text style={styles.label}>CVV</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="123"
                                placeholderTextColor="#4A5568"
                                keyboardType="numeric"
                                value={cvv}
                                onChangeText={setCvv}
                            />
                        </View>
                    </View>
                </View>
            )}
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.successWrapper}>
            <View style={styles.successIconBox}>
                <View style={styles.checkIcon} />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successBody}>
                An email with your tickets and secure login credentials has been sent to <Text style={{ color: '#00C2FF' }}>{email}</Text>.
            </Text>

            <View style={styles.ticketSummary}>
                <View style={styles.ticketHeader}>
                    <Text style={styles.tickTitle}>{displayEvent.title}</Text>
                    <Text style={styles.tickId}>Order #M1T-AVM2026</Text>
                </View>
                {getSelectedItems().map(tier => (
                    <View key={tier.id} style={styles.tickRow}>
                        <Text style={styles.tickLabel}>{tier.name}</Text>
                        <Text style={styles.tickVal}>{selectedTickets[tier.id]} x ₱{tier.price.toLocaleString()}</Text>
                    </View>
                ))}
                <View style={[styles.divider, { marginVertical: 8, borderColor: '#132035' }]} />
                <View style={styles.tickRow}>
                    <Text style={styles.totalLabelSmall}>Total Paid</Text>
                    <Text style={[styles.tickVal, { color: '#00C2FF' }]}>₱{calculateTotal().toLocaleString()}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => navigation.navigate('CustomerHistory')}
            >
                <Text style={styles.actionBtnText}>VIEW MY TICKETS</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <View style={styles.bgGlass1} />
            <View style={styles.bgGlass2} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {step === 0 ? renderHeader() : (
                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={handleBack} style={styles.backCircle}>
                            <View style={styles.backArrowLine} />
                        </TouchableOpacity>
                        <View style={styles.progress}>
                            {[...Array(4)].map((_, i) => (
                                <View key={i} style={[styles.progressDot, step > i && styles.dotActive]} />
                            ))}
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                )}

                <View style={styles.main}>
                    {step === 0 && renderStep0()}
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                </View>

                {/* Sticky Footer */}
                {step < 4 && getTotalQty() > 0 && (
                    <View style={styles.stickyBar}>
                        <View style={styles.stickyLeft}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.selectedTiersScroll}
                                contentContainerStyle={{ alignItems: 'center' }}
                            >
                                {getSelectedItems().map((tier, idx) => (
                                    <View key={tier.id} style={[styles.tierPill, { borderColor: tier.color + '40' }]}>
                                        <View style={[styles.tierPillDot, { backgroundColor: tier.color }]} />
                                        <Text style={styles.tierPillText}>
                                            <Text style={{ fontWeight: '900', color: '#FFF' }}>{selectedTickets[tier.id]}x</Text> {tier.name}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                            <View style={styles.totalRowSmall}>
                                <Text style={styles.totalLabelSmall}>Total Due</Text>
                                <Text style={styles.totalPriceSmall}>₱{calculateTotal().toLocaleString()}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.continueBtn} onPress={handleNext}>
                            <Text style={styles.continueText}>
                                {step === 3 ? 'PAY NOW' : 'NEXT'}
                            </Text>
                            <View style={styles.nextArrowLine} />
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>

            {/* Seat Map Modal */}
            <Modal visible={isMapVisible} 
            transparent 
            animationType="fade">
                <View style={styles.modalBg}>
                    <TouchableOpacity style={styles.modalClose} onPress={() => setIsMapVisible(false)}>
                        <Text style={styles.modalCloseText}>✕ CLOSE</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: SEAT_MAP_URL }} style={styles.modalImage} resizeMode="contain" />                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050A14' },
    safeArea: { flex: 1 },
    main: { flex: 1 },

    // Branded Header (AttendeeHomeScreen Style)
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12
    },
    menuBtn: { width: 40, height: 40, justifyContent: 'center' },
    menuLine: { height: 2, width: 22, backgroundColor: '#FFF', borderRadius: 2, marginVertical: 2.5 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerBranding: { fontSize: 20, fontWeight: '700' },
    headerMedia: { color: '#FFF', fontWeight: '600' },
    headerTix: { color: '#00C2FF', fontWeight: '800' },
    profileBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
    profileAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#132035', borderWidth: 1, borderColor: '#00C2FF30' },

    // Background
    bgGlass1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: '#00C2FF', top: -100, right: -100, opacity: 0.04 },
    bgGlass2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#FF5733', bottom: -50, left: -100, opacity: 0.03 },

    // Nav (Internal steps)
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
    backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0B1623', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#132035' },
    backArrowLine: { width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#00C2FF', transform: [{ rotate: '45deg' }], marginLeft: 4 },
    progress: { flexDirection: 'row', gap: 6 },
    progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#132035' },
    dotActive: { backgroundColor: '#00C2FF', width: 12 },

    scrollContent: { paddingBottom: 40 },

    // Step 0 UI
    banner: { height: height * 0.28, width: '100%', position: 'relative' },
    bannerImage: { width: '100%', height: '100%' },
    bannerOverlay: { ...StyleSheet.absoluteFillObject },
    bannerContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    categoryTag: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginBottom: 8 },
    categoryTagText: { color: '#050A14', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    eventTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
    eventMetaContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 },
    metaBadgeLight: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    metaTextDark: { color: '#000', fontSize: 11, fontWeight: '700' },

    sectionHeader: { paddingHorizontal: 20, marginTop: 40, marginBottom: 16 },
    sectionTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 2 },

    artistList: { paddingHorizontal: 15 },
    artistCard: { width: 150, height: 210, borderRadius: 20, overflow: 'hidden', marginHorizontal: 5, backgroundColor: '#0B1623' },
    artistPhoto: { width: '100%', height: '100%' },
    artistInfoBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(5, 10, 20, 0.7)' },
    artistName: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    artistRole: { color: '#00C2FF', fontSize: 8, fontWeight: '600' },
    artistBioTextSmall: { color: '#A0AEC0', fontSize: 9, marginTop: 6, lineHeight: 13 },

    aboutContainer: { paddingHorizontal: 20, marginTop: 32 },
    aboutText: { color: '#4A5568', fontSize: 14, lineHeight: 22 },
    expandBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    expandBtnText: { color: '#00C2FF', fontSize: 13, fontWeight: '700' },
    arrowIcon: { width: 8, height: 8, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#00C2FF', transform: [{ rotate: '45deg' }] },
    arrowRotated: { transform: [{ rotate: '-135deg' }], marginBottom: -4 },
    expandedContent: { marginTop: 15, padding: 15, backgroundColor: '#0B1623', borderRadius: 16, borderWidth: 1, borderColor: '#132035' },
    guidelineText: { color: '#4A5568', fontSize: 12, marginVertical: 4 },

    seatMapCard: { marginHorizontal: 20, height: 180, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0B1623', borderWidth: 1, borderColor: '#132035' },
    seatMapImage: { width: '100%', height: '100%', opacity: 0.6 },
    mapOverlay: { position: 'absolute', bottom: 15, left: 0, right: 0, alignItems: 'center' },
    mapHint: { color: '#FFF', fontSize: 11, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },

    // Tier Selection (Revised V5)
    tierCard: { marginHorizontal: 20, backgroundColor: '#0B1623', borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1.5, borderColor: '#132035' },
    tierHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    tierName: { color: '#FFF', fontSize: 17, fontWeight: '800' },
    tierType: { color: '#4A5568', fontSize: 11, marginTop: 2 },
    availTagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    availDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    availText: { color: '#4A5568', fontSize: 9, fontWeight: '800' },
    tierPriceControl: { alignItems: 'flex-end', marginLeft: 15 },
    tierPrice: { fontSize: 18, fontWeight: '900', marginBottom: 8 },

    tierQtyAction: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#132035',
        borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#2E4A62'
    },
    minQtyBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1623', borderRadius: 8 },
    minQtyText: { color: '#FFF', fontSize: 18, fontWeight: '300' },
    plusQtyBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00C2FF', borderRadius: 8 },
    plusQtyText: { color: '#050A14', fontSize: 18, fontWeight: '700' },
    tierQtyValue: { color: '#FFF', fontSize: 15, fontWeight: '800', paddingHorizontal: 12 },

    qtyBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#00C2FF', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    qtyBadgeText: { color: '#050A14', fontSize: 12, fontWeight: '800' },

    tierPerksRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#132035' },
    perkDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3D6080', marginRight: 8 },
    perkText: { color: '#3D6080', fontSize: 10, flex: 1 },

    // Step 1: Page
    pageContainer: { paddingHorizontal: 24, paddingTop: 20 },
    pageTitle: { color: '#FFF', fontSize: 28, fontWeight: '900' },
    pageSub: { color: '#4A5568', fontSize: 14, marginTop: 8 },
    form: { marginTop: 40 },
    inputGroup: { marginBottom: 20 },
    label: { color: '#3D6080', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
    input: { backgroundColor: '#0B1623', borderRadius: 16, height: 56, paddingHorizontal: 20, color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: '#132035' },

    // Step 2: Confirmation
    summaryCard: { backgroundColor: '#0B1623', borderRadius: 24, padding: 24, marginTop: 30, borderWidth: 1, borderColor: '#132035' },
    summaryHeading: { color: '#2E4A62', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { color: '#4A5568', fontSize: 14 },
    summaryVal: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#132035' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#00C2FF' },
    totalLabel: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    totalVal: { color: '#00C2FF', fontSize: 20, fontWeight: '900' },
    promoWrap: { flexDirection: 'row', marginTop: 20, gap: 10 },
    promoInput: { flex: 1, backgroundColor: '#0B1623', borderRadius: 16, height: 52, paddingHorizontal: 20, color: '#FFF', borderWidth: 1, borderColor: '#132035' },
    applyBtn: { paddingHorizontal: 20, borderRadius: 16, backgroundColor: '#132035', justifyContent: 'center' },
    applyBtnText: { color: '#00C2FF', fontSize: 12, fontWeight: '800' },

    // Step 3: Payment
    paymentToggle: { flexDirection: 'row', gap: 15, marginTop: 30 },
    toggleBtn: { flex: 1, height: 75, backgroundColor: '#0B1623', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#132035' },
    toggleActive: { borderColor: '#00C2FF', backgroundColor: '#00C2FF10' },
    gcashLogo: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#007DFE' },
    cardIcon: { width: 30, height: 20, borderRadius: 4, backgroundColor: '#4A5568' },
    toggleText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: 4 },
    paymentForm: { marginTop: 30 },
    row: { flexDirection: 'row' },

    // Step 4: Success
    successWrapper: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
    successIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00E5A020', borderWidth: 2, borderColor: '#00E5A0', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
    checkIcon: { width: 30, height: 15, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: '#00E5A0', transform: [{ rotate: '-45deg' }], marginTop: -5 },
    successTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center' },
    successBody: { color: '#4A5568', textAlign: 'center', fontSize: 14, marginTop: 15, lineHeight: 22 },
    ticketSummary: { width: '100%', backgroundColor: '#0B1623', borderRadius: 24, padding: 24, marginTop: 40, borderStyle: 'solid', borderWidth: 1.5, borderColor: '#132035' },
    ticketHeader: { borderBottomWidth: 1, borderBottomColor: '#132035', paddingBottom: 15, marginBottom: 15 },
    tickTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    tickId: { color: '#3D6080', fontSize: 10, marginTop: 4 },
    tickRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    tickLabel: { color: '#4A5568', fontSize: 11 },
    tickVal: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    actionBtnPrimary: { backgroundColor: '#00C2FF', width: '100%', height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    actionBtnText: { color: '#050A14', fontSize: 14, fontWeight: '900', letterSpacing: 2 },

    // Footer
    stickyBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Platform.OS === 'ios' ? 120 : 105, backgroundColor: '#0B1623', borderTopWidth: 1, borderTopColor: '#132035', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 20 : 5 },
    stickyLeft: { flex: 1, marginRight: 15, justifyContent: 'center' },
    selectedTiersScroll: { marginBottom: 6, flexGrow: 0 },
    tierPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(11, 22, 35, 0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginRight: 8 },
    tierPillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    tierPillText: { color: '#A0AEC0', fontSize: 11, fontWeight: '600' },
    totalRowSmall: { flexDirection: 'row', alignItems: 'center' },
    totalLabelSmall: { color: '#00C2FF', fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', backgroundColor: 'rgba(0, 194, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    totalPriceSmall: { color: '#FFF', fontSize: 22, fontWeight: '900', marginLeft: 10 },
    continueBtn: { backgroundColor: '#00C2FF', paddingHorizontal: 18, height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
    continueText: { color: '#050A14', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    nextArrowLine: { width: 10, height: 10, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#050A14', transform: [{ rotate: '-45deg' }] },

    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(5, 10, 20, 0.98)', justifyContent: 'center', alignItems: 'center' },
    modalClose: { position: 'absolute', top: 60, right: 30 },
    modalCloseText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
    modalImage: { width: '90%', height: '70%' },
    modalHint: { color: '#4A5568', fontSize: 12, marginTop: 20 },
});