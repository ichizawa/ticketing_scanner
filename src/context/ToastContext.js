import { createContext } from "react";

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {

    return (
        <ToastContext.Provider native value={{

        }}>
            {children}
        </ToastContext.Provider>
    )
};