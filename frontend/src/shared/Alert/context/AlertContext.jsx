import React, { createContext, useContext } from "react";
import { useAlert } from "../hooks/useAlert";

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const alert = useAlert();

  return (
    <AlertContext.Provider value={alert}>
      {children}
      {alert.AlertComponent()}
    </AlertContext.Provider>
  );
};

export const useGlobalAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useGlobalAlert must be used within an AlertProvider");
  }
  return context;
};
