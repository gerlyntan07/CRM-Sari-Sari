// hooks/protectedRoute.jsx
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from './useAuth.js';

const PrivateRoute = ({ children, requiredRole }) => {        
    const { isLoggedIn, userRole } = useAuth();

    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    if (!requiredRole) {
        if (userRole.toUpperCase() === 'ADMIN' || userRole.toUpperCase() === 'CEO') {
            return <Navigate to={`/admin/dashboard`} replace />;
        } else if (userRole === 'GROUP MANAGER') {
            return <Navigate to="/group-manager/dashboard" replace />;
        } else if(userRole === 'MANAGER') {
            return <Navigate to="/manager/dashboard" replace />;
        } else if (userRole === 'SALES') {
            return <Navigate to="/sales/dashboard" replace />;
        } else {
            return <Navigate to="/" replace />;
        }
    }

    // Role-based access control
    const normalizedUserRole = userRole.toLowerCase();
    const normalizedRequiredRole = requiredRole.toLowerCase();
    
    // Check if user role matches required role
    if (normalizedUserRole !== normalizedRequiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PrivateRoute;