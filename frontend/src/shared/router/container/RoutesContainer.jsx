import React from "react";
import { Navigate } from "react-router-dom";
import CenteredLoader from "../../loader/CenteredLoader";
import { useAuth } from "../../../components/auth/context/AuthContext";

const RoutesContainer = ({
  element: Page,
  isProtected,
  requiredRoles,
  publicRoute,
}) => {
  const { isLogin, userData, authLoading } = useAuth();

 

  if (authLoading) {
    return <CenteredLoader />;
  }

  if (publicRoute) {
    return <Page />;
  }

  if (isProtected && !isLogin) {
    return <Navigate to="/" replace />;
  }
  if (!isProtected && isLogin) {
   
    return <Navigate to="/home" replace />;
  }

  // Any held role may satisfy the route (roles[0] alone would lock out staff
  // whose extra roles, like a clearance-office officer, come after their main one).
  if (requiredRoles && !requiredRoles.some((r) => userData?.roles?.includes(r))) {
    
    return <Navigate to="/unauthorized" replace />;
  }

  return <Page />;
};

export default RoutesContainer;
