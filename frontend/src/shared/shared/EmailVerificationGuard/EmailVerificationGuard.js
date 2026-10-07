// shared/EmailVerificationGuard/EmailVerificationGuard.js
import React from 'react';
import { useAuth } from '../../../components/auth/context/AuthContext';
import EmailVerificationView from './view/EmailVerificationView';

const EmailVerificationGuard = ({ children }) => {
  const { isLogin, userData } = useAuth();

  // If not logged in, show children (will be handled by route protection)
  if (!isLogin) {
    return children;
  }

  // Check if email is verified - access the property directly from userData
  const isEmailVerified = userData?.emailVerified === true;

  // If logged in but email not verified, show verification screen
  if (!isEmailVerified) {
    return <EmailVerificationView email={userData?.email} />;
  }

  // Email verified, allow access
  return children;
};

export default EmailVerificationGuard;