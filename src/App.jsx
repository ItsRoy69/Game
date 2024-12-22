import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { ChatProvider } from './contexts/ChatContext';
import AppRoutes from './routes/Routes';
import './App.css';

function AuthenticationWrapper({ children }) {
  const { isAuthenticated, getAccessTokenSilently, user, isLoading } = useAuth0();

  useEffect(() => {
    const syncUserData = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              scope: 'openid profile email'
            }
          });
          
          const API_BASE_URL = import.meta.env.VITE_API_URL;
          
          console.log('Token obtained:', token ? 'Token exists' : 'No token');
          
          const response = await axios.post(
            `${API_BASE_URL}/api/users`,
            {
              auth0Id: user.sub,
              email: user.email,
              name: user.name,
              picture: user.picture,
              email_verified: user.email_verified,
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            }
          );
          
          console.log('User sync successful:', response.data);
        } catch (error) {
          console.error('Error syncing user data:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
          });
        }
      }
    };

    if (!isLoading) {
      syncUserData();
    }
  }, [isAuthenticated, user, getAccessTokenSilently, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return children;
}

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email'
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <Router>
        <AuthenticationWrapper>
          <ChatProvider>
            <AppRoutes />
          </ChatProvider>
        </AuthenticationWrapper>
      </Router>
    </Auth0Provider>
  );
}

export default App;