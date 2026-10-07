export const initialState = {
    userData: null,
    token: null,
    authLoading: true,
    isLogin: false,
  };
  
  export const authReducer = (state, action) => {
    switch (action.type) {
      case "LOGIN":
        return {
          ...state,
          ...action.payload,
          authLoading: false,
          isLogin: true,
        };
      case "LOGOUT":
        return {
          ...state,
          userData: null,
          token: null,
          authLoading: false,
          isLogin: false,
        };
      case "SET_LOADING":
        return { ...state, authLoading: action.payload };
      default:
        return state;
    }
  };
  