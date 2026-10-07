

export const getAuthToken = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("LOGIN_USER_DATA"));
    return userData?.token || null;
  } catch (error) {
    console.error("Error retrieving token from localStorage:", error);
    return null;
  }
};

export const getUserId = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("LOGIN_USER_DATA"));
    return userData?.userData?.id || null;
  } catch (error) {
    console.error("Error retrieving Id from localStorage:", error);
    return null;
  }
};


export const getUserProfile = () => {
  try {
    const storedData = JSON.parse(localStorage.getItem("LOGIN_USER_DATA"));

    if (storedData?.userData) {
      return {
        ...storedData.userData,
        _id: storedData.userData.id || storedData.userData._id,
      };
    }
    return null;
  } catch (error) {
    console.error("Error retrieving user from localStorage:", error);
    return null;
  }
};
