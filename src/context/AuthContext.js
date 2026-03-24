import { createContext, useState } from "react";
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
    const login = (email, password) => {
        try {
            fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: email,
                    password: password
                })
            })
            .then(processResponse)
            .then(res => {
                const {statusCode, data} = res;
                console.log('Login Response:', data);
                if(statusCode === 200) {
                    setUserInfo(data);
                }else {
                    alert(data.error);
                }
            })
            .catch((e) => 
            // console.log(data)
            console.log(e)
            )
        } catch (e) {
            console.log(e);
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
        // Always clear user info regardless of API response
        setUserInfo(null);
        console.log('User logged out');
    }

    return (
        <AuthContext.Provider value={{
            login,
            logout,
            userInfo
        }}>
            {children}
        </AuthContext.Provider>
    )
};