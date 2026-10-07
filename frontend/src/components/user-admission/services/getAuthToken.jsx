export const getAuthToken = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("LOGIN_USER_DATA"));
  
    return userData?.token || null;
  
  } catch (error) {
    console.error("Error retrieving token from localStorage:", error);
    return null;
  }
};
