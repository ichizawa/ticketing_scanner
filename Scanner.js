import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
} from "react-native";
import { StatusBar } from "expo-status-bar";

export default function Scanner({ navigation }) {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.topBar} />
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={require("./assets/mediaone.png")} />
          <Text style={styles.textLogo}>EDIAONE TIX</Text>
        </View>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.buttonGrant}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground source={require("./assets/bg.png")} style={styles.container}>
      <StatusBar hidden={false} translucent={true} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QR Reader</Text>
      </View>
      <View style={styles.cameraWrapper}>
        <ImageBackground
          source={require("./assets/frame.png")}
          style={styles.frameImage}
          resizeMode="contain"
        >
          <CameraView
            style={styles.camera}
            facing={facing}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={(data) => {
              navigation.navigate("TicketDetails", { data: data });
            }}
          />
        </ImageBackground>
        <View style={styles.overlayText}>
          <Image source={require("./assets/scanner.png")} style={styles.scannerIcon} />
          <Text style={styles.text}>Place the QR Code inside the frame to scan.</Text>
        </View>
      </View>
      <ImageBackground source={require("./assets/footer1.png")} style={styles.footer} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
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
    paddingTop: 15,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5
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
    resizeMode: "contain"
  },
});

