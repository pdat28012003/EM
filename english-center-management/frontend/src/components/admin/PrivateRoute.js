import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userStr = localStorage.getItem('user');
  const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
  const userRole = (user?.role || '').toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());
  
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
    console.log('Role not allowed:', userRole, 'not in', normalizedAllowedRoles);
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default PrivateRoute;
