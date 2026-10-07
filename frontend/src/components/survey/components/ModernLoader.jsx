import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

const ModernLoader = ({ message = "Loading...", size = 40 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: 2,
      }}
    >
      <Fade in={true} timeout={600}>
        <Box sx={{ position: 'relative' }}>
          <CircularProgress
            size={size}
            thickness={4}
            sx={{
              color: 'primary.main',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <CircularProgress
            size={size}
            thickness={4}
            sx={{
              color: 'secondary.main',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.3,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
            variant="determinate"
            value={100}
          />
        </Box>
      </Fade>
      <Fade in={true} timeout={800}>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          {message}
        </Typography>
      </Fade>
    </Box>
  );
};

export default ModernLoader;
