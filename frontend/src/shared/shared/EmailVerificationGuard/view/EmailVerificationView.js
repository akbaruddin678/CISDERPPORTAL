// shared/EmailVerificationGuard/view/EmailVerificationView.js
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../../auth/context/AuthContext';
import { useResendVerificationMutation } from '../../../components/user/api/userApi';
import { useGlobalAlert } from '../../Alert/context/AlertContext';

const EmailVerificationView = ({ email }) => {
  const [resendVerification, { isLoading }] = useResendVerificationMutation();
  const { dispatchAuthLogout } = useAuth();
  const { openAlert } = useGlobalAlert();

  const handleResendVerification = async () => {
    try {
      await resendVerification({ email }).unwrap();
      openAlert({
        message: 'Verification email sent! Please check your inbox.',
        severity: 'success'
      });
    } catch (error) {
      openAlert({
        message: error?.data?.message || 'Failed to send verification email',
        severity: 'error'
      });
    }
  };

  const handleLogout = () => {
    dispatchAuthLogout();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Verify Your Email
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          You need to verify your email address before accessing the application.
        </Alert>

        <Typography variant="body1" sx={{ mb: 3 }}>
          We've sent a verification link to <strong>{email}</strong>. 
          Please check your email and click the verification link to continue.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Didn't receive the email? Check your spam folder or request a new verification link.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleResendVerification}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Sending...' : 'Resend Verification Email'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmailVerificationView;