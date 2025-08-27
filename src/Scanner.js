import { CameraView, useCameraPermissions } from "expo-camera";
import NetInfo from "@react-native-community/netinfo";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from '@react-navigation/native';

export default function Scanner({ navigation }) {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isConnected, setConnected] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.topBar} />
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require("../assets/mediaone.png")}
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

  return (
    <ImageBackground
      source={require("../assets/bg.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* <StatusBar hidden={false} translucent={true} /> */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QR Reader</Text>
        </View>
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
        <View style={styles.cameraWrapper}>
          <ImageBackground
            source={require("../assets/frame.png")}
            style={styles.frameImage}
            resizeMode="contain"
          >
            {isFocused && ( // <-- only render camera when screen is focused
              <CameraView
                style={styles.camera}
                facing={facing}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={(data) => {
                  navigation.navigate("TicketDetails", { data: data });
                }}
              />
            )}
          </ImageBackground>
          <View style={styles.overlayText}>
            <Image
              source={require("../assets/scanner.png")}
              style={styles.scannerIcon}
            />
            <Text style={styles.text}>
              Place the QR Code inside the frame to scan.
            </Text>
          </View>
        </View>
        <ImageBackground
          source={require("../assets/footer1.png")}
          style={styles.footer}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    width: "100%",
    height: 70,
    backgroundColor: "#0F355A",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  permissionContainer: {
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

  cameraWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  frameImage: {
    width: 300,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: 245,
    height: 245,
  },
  overlayText: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 70,
    padding: 8,
    borderWidth: 2,
    borderColor: "#0F355A",
    borderRadius: 10,
  },
  scannerIcon: {
    height: 25,
    width: 25,
    marginRight: 5,
  },
  text: {
    fontSize: 13,
    color: "#0F355A",
  },
  footer: {
    width: "100%",
    height: 140,
    position: "absolute",
    bottom: 0,
    resizeMode: "contain",
  },
  offlineContainer: {
    backgroundColor: "#b52424",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    zIndex: 10,
    position: "absolute",
    top: 65,
    paddingBottom: 10,
    paddingTop: 10,
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
});
