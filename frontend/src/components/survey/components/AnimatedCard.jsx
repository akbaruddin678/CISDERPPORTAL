import React from 'react';
import { Card, CardContent, Fade, Grow } from '@mui/material';

const AnimatedCard = ({ 
  children, 
  delay = 0, 
  animation = 'fade',
  sx = {},
  ...props 
}) => {
  const animationProps = {
    fade: {
      in: true,
      timeout: 600 + delay,
    },
    grow: {
      in: true,
      timeout: 600 + delay,
    }
  };

  const AnimationComponent = animation === 'grow' ? Grow : Fade;

  return (
    <AnimationComponent {...animationProps[animation]}>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.15)',
          },
          ...sx,
        }}
        {...props}
      >
        <CardContent sx={{ p: 3 }}>
          {children}
        </CardContent>
      </Card>
    </AnimationComponent>
  );
};

export default AnimatedCard;
