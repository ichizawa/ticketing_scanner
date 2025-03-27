import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useEffect, useRef } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function Scanner({ navigation }) {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [qrDetected, setQrDetected] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const zoomAnim = useRef(new Animated.Value(1)).current;
  
  // Start the pulse animation
  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [scanning]);

  // Handle QR code detection
  const handleBarcodeScanned = (data) => {
    setQrDetected(true);
    setScanning(false);
    
    // Zoom animation when QR code is detected
    Animated.timing(zoomAnim, {
      toValue: 1.3,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // After zoom completes, navigate to details
      setTimeout(() => {
        navigation.navigate("TicketDetails", { data: data });
        // Reset animations for when user comes back
        setQrDetected(false);
        setScanning(true);
        zoomAnim.setValue(1);
      }, 500);
    });
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.topBar} />
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require("./assets/mediaone.png")}
          />
          <Text style={styles.textLogo}>EDIAONE TIX</Text>
        </View>
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.buttonGrant}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  return (
    <ImageBackground
      source={require("./assets/bg.png")}
      style={styles.container}
    >
      <StatusBar hidden={false} translucent={true} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QR Reader</Text>
      </View>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.frameContainer,
            {
              transform: [
                { scale: qrDetected ? zoomAnim : pulseAnim }
              ]
            }
          ]}
        >
          <ImageBackground
            source={require("./assets/frame.png")}
            style={styles.frameImage}
          >
            <CameraView
              style={styles.camera}
              facing={facing}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
            ></CameraView>
          </ImageBackground>
        </Animated.View>
        <View style={styles.overlayText}>
          <Image
            source={require("./assets/scanner.png")}
            style={styles.scannerIcon}
          />
          <Text style={styles.text}>
            {qrDetected ? "QR Code detected!" : "Place the QR Code inside the frame to scan."}
          </Text>
        </View>
      </View>
      <ImageBackground
        source={require("./assets/footer1.png")}
        style={styles.footer}
      ></ImageBackground>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  frameContainer: {
    position: "absolute",
    top: 170,
    left: 40,
    right: 40,
    bottom: 320,
  },
  header: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 75,
    backgroundColor: "#0F355A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    zIndex: 1,
    paddingTop: 15,
    borderBottomEndRadius: 5,
    borderBottomLeftRadius: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 19,
    marginLeft: 10,
    textAlign: "center",
  },
  camera: {
    width: "80%",
    height: 230,
    alignSelf: "center",
    marginTop: 30,
    marginBottom: 320,
  },
  cameraContainer: {
    backgroundColor: "#000",
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  overlayText: {
    position: "absolute",
    bottom: 225,
    alignSelf: "center",
    width: "85%",
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#0F355A",
    borderRadius: 10,
    padding: 10,
  },
  scannerIcon: {
    height: 30,
    width: 30,
    marginRight: 1,
  },
  text: {
    fontSize: 13,
    color: "#0F355A",
    padding: 5,
  },
  permissionContainer: {
    height: "50%",
    width: "90%",
    marginTop: 150,
    marginLeft: "5%",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff",
    shadowColor: "#000",
    padding: 30,
    alignItems: "center",
    overflow: "hidden",
  },
  topBar: {
    position: "absolute",
    top: 0,
    width: "160%",
    height: 8,
    backgroundColor: "#0F355A",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    height: 72,
    width: 72,
  },
  textLogo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F355A",
    marginTop: 35,
  },
  permissionText: {
    textAlign: "center",
    marginVertical: 40,
    fontSize: 15,
    fontWeight: "300",
  },
  buttonGrant: {
    backgroundColor: "#0F355A",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: -1,
    width: "100%",
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    resizeMode: "contain",
    flex: 1,
  },
  frameImage: {
    flex: 1,
    resizeMode: "contain",
  },
});