import React from 'react';
import { Box, Typography, Paper, Fade } from '@mui/material';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  sx = {} 
}) => {
  return (
    <Fade in={true} timeout={600}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          ...sx,
        }}
      >
        <Box sx={{ mb: 3 }}>
          {icon}
        </Box>
        <Typography 
          variant="h5" 
          fontWeight={600} 
          color="text.primary" 
          gutterBottom
        >
          {title}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
        >
          {description}
        </Typography>
        {action && (
          <Box sx={{ mt: 2 }}>
            {action}
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

export default EmptyState;
