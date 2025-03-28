import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import React from 'react'
import QRCode from 'react-native-qrcode-svg'

const window_width = Dimensions.get("window").width
const window_height = Dimensions.get("window").height

export default function TicketDetails({navigation, route}) {
    const { data } = route.params;

    const getDots = () => {
        let width = Math.trunc(((window_width - (window_width * 0.10)) / 16) - 10)
        let dots = [];
        for(let i = 1; i < width; i++) {
            dots.push(<View key={i} style={styles.dots}/>);
        }
        return dots
    }
    // fetch(`https://mediaonetix.com/scan/ticket/${data.data}`)
    const redeemTicket = () => {
        try {
            fetch(`http://192.168.110.116:8000/scan/ticket/${data.data}`)
            .then(response => response.json())
            .then(json => {
                alert(json.message);
                navigation.navigate("Scanner");
            })
            .catch(error => {
                console.error(error);
            });
        } catch (e) {
            console.log(e)
        }
    }
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.horizontalRuleTop}>
                    <View style={styles.bigDotsLeft}></View>
                    {getDots() !== null?
                            getDots().map((dot) => {
                                return dot;
                            })
                        :
                            null
                    }
                    <View style={styles.bigDotsRight}></View>
                </View>
                <View style={styles.ticketBody}>
                    <QRCode value={data.data} size={300}/>
                </View>
                <View style={styles.horizontalRuleBottom}>
                    <View style={styles.bigDotsLeft}></View>
                    {getDots() !== null?
                            getDots().map((dot) => {
                                return dot;
                            })
                        :
                            null
                    }
                    <View style={styles.bigDotsRight}></View>
                </View>
            </View>
            <View style={styles.submitButtonContainer}>
                <TouchableOpacity style={styles.submitButton} onPress={() => redeemTicket()}>
                    <Text style={{color: '#fff', fontSize: 20}}>Redeem</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#48a7c5',
      paddingHorizontal: '10%',
      paddingVertical: '20%'
    },
    card: {
        flex: 1,
        position: 'relative',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10
    },
    horizontalRuleTop: {
        position: 'absolute',
        top: 180,
        alignItems: 'center',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    horizontalRuleBottom: {
        position: 'absolute',
        bottom: 180,
        alignItems: 'center',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    dots: {
        backgroundColor: '#48a7c5',
        height: 14,
        width: 14,
        borderRadius: 7
    },
    bigDotsLeft: {
        backgroundColor: '#48a7c5',
        height: 36,
        width: 36,
        borderRadius: 18,
        marginLeft: -18
    },
    bigDotsRight: {
        backgroundColor: '#48a7c5',
        height: 36,
        width: 36,
        borderRadius: 18,
        marginRight: -18
    },
    ticketBody: {
        position: 'absolute',
        bottom: 180,
        top: 180,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    submitButtonContainer: {
        width: '100%',
        marginTop: 20
    },
    submitButton: {
        height: 60,
        elevation: 5,
        backgroundColor: '#4535C1',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center'
    }
  });