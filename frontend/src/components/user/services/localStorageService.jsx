const LOCAL_STORAGE_KEY = "LOGIN_USER_DATA";

export const saveUserData = (data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving user data to localStorage:", error);
  }
};

export const getUserData = () => {
  try {
    const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : null;
  } catch (error) {
    console.error("Error reading user data from localStorage:", error);
    return null;
  }
};

export const clearUserData = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error("Error removing user data from localStorage:", error);
  }
};
