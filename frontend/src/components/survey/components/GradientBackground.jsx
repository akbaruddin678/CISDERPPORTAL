import React from 'react';
import { Box } from '@mui/material';

const GradientBackground = ({ children, variant = 'primary', ...props }) => {
  const gradients = {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    info: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    dark: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    light: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: gradients[variant],
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          zIndex: 1,
        },
        '& > *': {
          position: 'relative',
          zIndex: 2,
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default GradientBackground;
