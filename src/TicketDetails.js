import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import React, { useContext, useRef } from "react";
import QRCode from "react-native-qrcode-svg";
import NetInfo from "@react-native-community/netinfo";
import { useState, useEffect } from "react";
import { BASE_URL } from './config';
import { AuthContext } from './context/AuthContext';

const window_width = Dimensions.get("window").width;
const window_height = Dimensions.get("window").height;

export default function TicketDetails({ navigation, route }) {
  const { userDetails } = useContext(AuthContext);
  const { data } = route.params;
  const [isConnected, setConnected] = useState(true);
  const [details, setDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [finalData, setFinalData] = useState(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const getDots = () => {
    let width = Math.trunc((window_width - window_width * 0.1) / 16 - 10);
    let dots = [];
    for (let i = 1; i < width; i++) {
      dots.push(<View key={i} style={styles.dots} />);
    }
    return dots;
  };

  // fetch(`http://192.168.110.116:8000/scan/ticket/${data.data}`

  useEffect(() => {
    if (data.data) {
      fetch(`${BASE_URL}scan/check-ticket/${data.data}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          'Authorization': `Bearer ${userDetails.token}`
        },
      })
        .then((response) => response.json())
        .then((json) => {
          console.info("details: ", json);
          setDetails(json.data);
        })
        .catch((error) => {
          console.error(error);
          Alert.alert("Error", error.message);
        });
    }
  }, [])


  const redeemTicket = () => {
    // if (!data) return null;

    try {
      fetch(`${BASE_URL}scan/ticket/${data.data}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          'Authorization': `Bearer ${userDetails.token}`
        },
      })
        .then((response) => response.json())
        .then((json) => {
          // console.log(json);
          // alert(json.message);
          // navigation.navigate("Scanner");
          setModalVisible(true);
          setFinalData(json);
        })
        .catch((error) => {
          console.error(error);
          Alert.alert("Error", error.message);
        });
    } catch (e) {
      console.log(e);
    }
  };

  const StatusModal = ({ visible, onClose, data }) => {
    if (!data) return null;

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        scaleAnim.setValue(0);
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
      }
    }, [visible]);

    const getStatusConfig = () => {
      switch (data.status) {
        case 200:
          return {
            title: 'Success!',
            message: data?.message || 'Ticket scanned successfully!',
            icon: '✅',
            color: '#4CAF50',
            backgroundColor: '#E8F5E8',
            buttonColor: '#4CAF50',
          };
        case 404:
          return {
            title: 'Not Found',
            message: data?.message || 'Ticket not found in the system.',
            icon: '❓',
            color: '#FF9800',
            backgroundColor: '#FFF3E0',
            buttonColor: '#FF9800',
          };
        case 401:
          return {
            title: 'Already Scanned',
            message: data?.message || 'This ticket has already been redeemed.',
            icon: '⚠️',
            color: '#F44336',
            backgroundColor: '#FFEBEE',
            buttonColor: '#F44336',
          };
        case 403:
          return {
            title: 'Access Denied',
            message: data?.message || 'You are not authorized to scan this ticket.',
            icon: '🔒',
            color: '#9C27B0',
            backgroundColor: '#F3E5F5',
            buttonColor: '#9C27B0',
          };
        default:
          return {
            title: 'Unknown Status',
            message: data?.message || 'An unexpected error occurred.',
            icon: '❌',
            color: '#607D8B',
            backgroundColor: '#ECEFF1',
            buttonColor: '#607D8B',
          };
      }
    };

    const config = getStatusConfig();

    return (
      <Modal
        animationType="none"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                ],
              },
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
              <Text style={styles.iconText}>{config.icon}</Text>
            </View>

            <View style={[styles.contentContainer, { backgroundColor: config.backgroundColor }]}>
              <Text style={[styles.title, { color: config.color }]}>
                {config.title}
              </Text>

              <Text style={styles.message}>
                {config.message}
              </Text>

              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: config.color }]}>
                  Status: {data.status}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: config.buttonColor }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* modal visibility */}
      <StatusModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setFinalData(null);
          setDetails(null);
          // navigation.navigate("Scanner");
          navigation.navigate("Main", { screen: "Scanner" });
        }}
        onPress={() => {
          setModalVisible(false);
          setFinalData(null);
          setDetails(null);
          // navigation.navigate("Scanner");
        }}
        data={finalData}
      />

      <View style={[{ backgroundColor: details ? details.ticket.ticket_color : "#0F778E" }, styles.header]}>
        {!isConnected && (
          <View style={styles.offlineContainer}>
            <Text style={[styles.offlineText, styles.largeText]}>
              You are offline
            </Text>
            <Text style={styles.offlineText}>
              Try connected with internet or come back later
            </Text>
          </View>
        )}

        <Text style={styles.text}>MY QR CODE</Text>
        <Text style={styles.subText}>Ticket Successfully Scanned!</Text>
        <Text style={styles.subText}>{details?.event.event_name ?? ""}</Text>
        <View style={styles.ticketBody}>
          <QRCode value={data.data} size={window_width * 0.65} />
        </View>
      </View>

      <View style={styles.containerButton}>
        <View style={styles.submitButtonContainer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => redeemTicket()}
          >
            <Text style={{ color: "#fff", fontSize: 20 }}>Redeem</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    //   paddingHorizontal: '10%',
    //   paddingVertical: '20%',
  },
  header: {
    width: "100%",
    height: "75%",
    // backgroundColor: "#0F778E",
    zIndex: 10,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
  },
  text: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 50,
  },
  subText: {
    fontSize: 15,
    fontWeight: "light",
    color: "#f5f5f5",
    textAlign: "center",
  },
  containerButton: {
    flex: 1,
    position: "relative",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  horizontalRuleTop: {
    position: "absolute",
    top: "55%",
    alignItems: "center",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  horizontalRuleBottom: {
    position: "absolute",
    bottom: "38%",
    alignItems: "center",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dots: {
    backgroundColor: "#0F778E",
    height: 14,
    width: 14,
    borderRadius: 7,
  },
  bigDotsLeft: {
    backgroundColor: "#0F778E",
    height: 36,
    width: 36,
    borderRadius: 18,
  },
  bigDotsRight: {
    backgroundColor: "#0F778E",
    height: 36,
    width: 36,
    borderRadius: 18,
  },
  ticketBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },

  submitButtonContainer: {
    width: "100%",
    marginTop: 25,
  },
  submitButton: {
    fontSize: 35,
    height: 55,
    margin: 30,
    elevation: 5,
    backgroundColor: "#0F355A",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineContainer: {
    backgroundColor: "#b52424",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    zIndex: 10,
    position: "absolute",
    top: 40,
    paddingBottom: 10,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  offlineText: {
    color: "#fff",
    textAlign: "center",
  },
  largeText: {
    fontWeight: "bold",
    fontSize: 24,
  },

  //Modal
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: window_width * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 40,
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
  },
  contentContainer: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    marginHorizontal: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#555',
    marginBottom: 15,
  },
  statusBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  button: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
