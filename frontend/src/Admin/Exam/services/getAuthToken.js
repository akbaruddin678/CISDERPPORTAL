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

// UI-only hint for show/hide (e.g. the "Grant override" button) — the
// server is the real authority and re-checks every action regardless.
export const getUserRoles = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("LOGIN_USER_DATA"));
    return userData?.roles || userData?.userData?.roles || [];
  } catch (error) {
    console.error("Error retrieving roles from localStorage:", error);
    return [];
  }
};
