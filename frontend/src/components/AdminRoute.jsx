// frontend/src/components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminRoute = ({ children }) => {
  const { isAdmin, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Jogosultság ellenőrzése..." />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;