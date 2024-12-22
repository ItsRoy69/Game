import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Bell } from "lucide-react";
import axios from "axios";
import io from "socket.io-client";
import "./navbar.css";

const NotificationItem = ({ notification, onClose }) => (
  <div className="notification-item">
    <p>{notification.message}</p>
    <button onClick={() => onClose(notification._id)}>✕</button>
  </div>
);

const NavBar = () => {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading, getAccessTokenSilently } = useAuth0();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.sub) return;

    try {
      const token = await getAccessTokenSilently();
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await axios.get(
        `${API_BASE_URL}/api/notifications/${user.sub}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      fetchNotifications();
      
      // Socket connection
      const socketInstance = io(import.meta.env.VITE_API_URL);
      setSocket(socketInstance);

      socketInstance.emit('register', user.sub);

      socketInstance.on('newNotification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [isAuthenticated, user, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      const token = await getAccessTokenSilently();
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      await axios.put(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const removeNotification = async (id) => {
    try {
      const token = await getAccessTokenSilently();
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      await axios.delete(
        `${API_BASE_URL}/api/notifications/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      notifications.forEach(notification => {
        if (!notification.read) {
          markAsRead(notification._id);
        }
      });
      setUnreadCount(0);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h1>GameZ</h1>
          </div>
          <div className="navbar-right">
            {isAuthenticated && (
              <div className="notification-container">
                <button className="notification-button" onClick={toggleNotifications}>
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClose={removeNotification}
                        />
                      ))
                    ) : (
                      <div className="no-notifications">No notifications</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {isAuthenticated ? (
              <>
                <div className="user-profile">
                  <img src={user.picture} alt={user.name} className="user-avatar" />
                  <span className="user-name">{user.name}</span>
                </div>
                <button
                  onClick={() => logout({ returnTo: window.location.origin })}
                  className="auth-button logout-button"
                >
                  Log Out
                </button>
              </>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="auth-button login-button"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;