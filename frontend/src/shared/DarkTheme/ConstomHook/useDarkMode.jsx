import { useState, useEffect } from "react";

const useDarkMode = () => {
  const isLocalStorageAvailable = typeof localStorage !== "undefined";

  // Retrieve darkMode value from localStorage
  const storedDarkMode = isLocalStorageAvailable
    ? localStorage.getItem("darkMode")
    : null;

  // Convert storedDarkMode to boolean
  const initialDarkMode = storedDarkMode === "true";

  const [darkMode, setDarkMode] = useState(initialDarkMode);

  useEffect(() => {
   
    if (isLocalStorageAvailable) {
      localStorage.setItem("darkMode", darkMode.toString());
    }
  }, [darkMode, isLocalStorageAvailable]);

  return [darkMode, setDarkMode];
};

export default useDarkMode;
