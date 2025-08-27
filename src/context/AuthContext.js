import React, { createContext, useState, useEffect } from "react";
import { BASE_URL, processResponse } from "../config";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from 'react-native-device-info';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userDetails, setUserDetails] = useState(null);

  const login = async (form) => {
    const deviceId = await DeviceInfo.getUniqueId();

    try {
      fetch(`${BASE_URL}login`, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          device_id: deviceId,
        }),
      })
        .then(processResponse)
        .then((res) => {
          const { statusCode, data } = res;
          if (statusCode == 200) {
            setUserDetails(data.data);
            AsyncStorage.setItem("userDetails", JSON.stringify(data.data));
          }else{
            Alert.alert("Error", data.message);
          }
          // console.info(data);
        })
        .catch((error) => {
          console.error(error);
          Alert.alert("Error", error.message);
        });
    } catch (error) {
      Alert.alert("Error", error.message);
      console.error(error);
    }
  };

  const logout = (details) => {
    try {
      setUserDetails(null);
      AsyncStorage.removeItem("userDetails");

      fetch(`${BASE_URL}logout`, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          'Authorization': `Bearer ${details.token}`
        }
      }).then(processResponse).then((res) => {
        const { statusCode, data } = res;
        // console.info("user logged out: ", data);
      });
    } catch (error) {
      Alert.alert("Error", error.message);
      console.error(error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem("userDetails");
      if (userData) {
        const parseData = JSON.parse(userData);
        setUserDetails(parseData);
      } else {
        setUserDetails(null);
        AsyncStorage.removeItem("userDetails");
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login,
        userDetails,
        logout
      }}>
      {children}
    </AuthContext.Provider>
  )
}