import { createContext, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { API_BASE_URL } from "../config";

const processResponse = async (response) => {
  const data = await response.json();
  return {
    statusCode: response.status,
    data: data
  };
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const showErrorModal = (title, message) => {
        setModalTitle(title);
        setModalMessage(message);
        setIsModalVisible(true);
    };

    const login = (email, password) => {
        try {
            fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            .then(processResponse)
            .then(res => {
                const {statusCode, data} = res;
                console.log('Login Response:', data);
                if(statusCode === 200) {
                    setUserInfo(data);
                } else {
                    const errorMsg = data?.message || 'Invalid Credentials. Please try again.';
                    showErrorModal('Login Failed', errorMsg);
                }
            })
            .catch((e) => {
                console.log('Login Network Error:', e);
                showErrorModal('Network Error', 'Could not connect to the server. Please check your internet connection and try again.');
            });
        } catch (e) {
            console.log('Login Error:', e);
            showErrorModal('Error', 'An unexpected error occurred.');
        }
    }

    const logout = () => {
        const token = userInfo?.token;
        if (token) {
            try {
                fetch(`${API_BASE_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                })
                .then(processResponse)
                .then(res => {
                    console.log('Logout Response:', res);
                })
                .catch((e) => console.log('Logout Error:', e))
            } catch (e) {
                console.log(e);
            }
        }
        setUserInfo(null);
        console.log('User logged out');
    }

    const closeModal = () => setIsModalVisible(false);

    return (
        <>
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.iconText}>!</Text>
                        </View>
                        
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        <Text style={styles.modalMessage}>{modalMessage}</Text>
                        
                        <TouchableOpacity onPress={closeModal} style={styles.modalOkBtn} activeOpacity={0.8}>
                            <Text style={styles.modalOkText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            <AuthContext.Provider value={{
                login,
                logout,
                userInfo,
                closeModal
            }}>
                {children}
            </AuthContext.Provider>
        </>
    )
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 10, 20, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        width: '85%', 
        backgroundColor: '#0B1623',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1A2A44',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(62, 194, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(62, 194, 255, 0.3)',
    },
    iconText: {
        color: '#3ec2ff',
        fontSize: 24,
        fontWeight: '900',
    },
    modalTitle: {
        color: '#FFFFFF', 
        fontSize: 22, 
        fontWeight: '800', 
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        color: '#A0B3C6', 
        fontSize: 15, 
        textAlign: 'center', 
        marginBottom: 30, 
        lineHeight: 22, 
        paddingHorizontal: 10,
    },
    modalOkBtn: {
        width: '100%', 
        paddingVertical: 14, 
        borderRadius: 16, 
        backgroundColor: '#3ec2ff', 
        alignItems: 'center', 
        shadowColor: '#3ec2ff', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.4, 
        shadowRadius: 8, 
        elevation: 4,
    },
    modalOkText: { 
        color: '#FFFFFF', 
        fontSize: 16, 
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});