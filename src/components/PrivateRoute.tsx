import React from 'react';
import { Navigate } from 'react-router-dom';


// PrivateRoute component to protect routes that require authentication
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = localStorage.getItem('token')

  if (!token) {
    // If no token (i.e., not logged in), redirect to the /auth page
    return <Navigate to="/auth" />;
  }

  return children; // If user is authenticated, render the children (protected page)
};

export default PrivateRoute;
