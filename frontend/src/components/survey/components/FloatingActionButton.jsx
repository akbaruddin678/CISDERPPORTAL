import React from 'react';
import { Fab, Tooltip, Zoom } from '@mui/material';

const FloatingActionButton = ({ 
  icon, 
  onClick, 
  tooltip, 
  color = 'primary',
  sx = {},
  ...props 
}) => {
  return (
    <Tooltip title={tooltip} placement="left">
      <Zoom in={true} timeout={300}>
        <Fab
          color={color}
          onClick={onClick}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
            },
            ...sx,
          }}
          {...props}
        >
          {icon}
        </Fab>
      </Zoom>
    </Tooltip>
  );
};

export default FloatingActionButton;
