import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import axios from 'axios';

export const useAuth = () => {
  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0();

  useEffect(() => {
    const syncUserData = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently();
          
          await axios.post('/api/users', {
            auth0Id: user.sub,
            email: user.email,
            name: user.name,
            picture: user.picture,
            email_verified: user.email_verified
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error('Error syncing user data:', error);
        }
      }
    };

    syncUserData();
  }, [isAuthenticated, user]);
};