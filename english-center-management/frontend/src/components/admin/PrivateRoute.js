import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || '').toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default PrivateRoute;
