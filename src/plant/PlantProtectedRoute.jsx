import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePlantAuth } from './PlantAuthContext';

const PlantProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = usePlantAuth();

  if (!isAuthenticated) {
    return <Navigate to="/plant-login" replace />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    if (user?.role === 'employee') return <Navigate to="/plant-employee" replace />;
    return <Navigate to="/plant-admin" replace />;
  }

  return children;
};

export default PlantProtectedRoute;
