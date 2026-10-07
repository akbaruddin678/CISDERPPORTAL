// AppRoute.js
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
// import { useAuth } from './AuthContext';

// this fucntion is not used yet
// NOTE::  this function is not used yet

const AppRoute = ({ element: Component, isProtected, requiredRole, ...rest }) => {
//   const { isAuthenticated, user } = useAuth();
// const [isAuthenticated, setisAuthenticated] = useState(true)
  // If the route is protected and the user is not authenticated, redirect to login
  // if (isProtected && !isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  // If a role is required and the user doesn't have it, redirect to unauthorized
//   if (isProtected && requiredRole && user?.role !== requiredRole) {
//     return <Navigate to="/unauthorized" replace />;
//   }

  // Render the component if all checks pass
  return <Component {...rest} />;
};

export default AppRoute;
