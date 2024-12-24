import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect } from 'react';
import axios from 'axios';

export const AuthProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export const ProfileProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, getAccessTokenSilently, user } = useAuth0();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkProfile = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently();
          const API_BASE_URL = import.meta.env.VITE_API_URL;
          
          const response = await axios.get(
            `${API_BASE_URL}/api/users/${user.sub}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const profile = response.data;
          const isComplete = profile && 
            profile.gender &&
            profile.datingPreferences?.length > 0 &&
            profile.about &&
            profile.dateOfBirth &&
            profile.photos?.length > 0 &&
            profile.favoriteGames?.length > 0;

          setIsProfileComplete(isComplete);
        } catch (error) {
          console.error('Error checking profile:', error);
          setIsProfileComplete(false);
        }
        setLoading(false);
      }
    };

    checkProfile();
  }, [isAuthenticated, getAccessTokenSilently, user]);

  if (isLoading || loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!isProfileComplete) {
    return <Navigate to="/profilesettings" state={{ from: location }} replace />;
  }

  return children;
};