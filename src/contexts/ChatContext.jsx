import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth0 } from '@auth0/auth0-react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]); 
  const [currentRoom, setCurrentRoom] = useState(null);
  const [privateChats, setPrivateChats] = useState(new Map());


  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      setSocket(newSocket);

      newSocket.emit('user_join', {
        userId: user.sub, // Auth0 user ID
        userName: user.name
      });

      return () => newSocket.close();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!socket) return;

    socket.on('active_users', (users) => {
      setActiveUsers(users.filter(u => u.userId !== user?.sub));
    });

    socket.on('private_message', (data) => {
      setPrivateChats(prev => {
        const chatId = data.from || data.to;
        const currentChat = prev.get(chatId) || [];
        const updatedChat = [...currentChat, data.message];
        const newChats = new Map(prev);
        newChats.set(chatId, updatedChat);
        return newChats;
      });
    });

    return () => {
      socket.off('active_users');
      socket.off('private_message');
    };
  }, [socket, user]);

  const sendPrivateMessage = (recipientId, message) => {
    if (socket && isAuthenticated) {
      socket.emit('private_message', {
        to: recipientId,
        message,
        from: user.sub
      });
    }
  };

  const sendGroupMessage = (roomId, message) => {
    if (socket && isAuthenticated) {
      socket.emit('group_message', {
        roomId,
        message,
        from: user.sub
      });
    }
  };

  const joinRoom = async (roomId) => {
    if (socket && isAuthenticated) {
      try {
        const token = await getAccessTokenSilently();
        // Fetch room messages before joining
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/messages/room/${roomId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const messages = await response.json();
        
        socket.emit('join_room', roomId);
        setCurrentRoom(roomId);
        return messages;
      } catch (error) {
        console.error('Error joining room:', error);
      }
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leave_room', roomId);
      setCurrentRoom(null);
    }
  };

  useEffect(() => {
    const fetchRooms = async () => {
      if (!isAuthenticated) return;
      
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: 'openid profile email'
          }
        });

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setChatRooms(data.data?.rooms || []); // Ensure we set an array
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setChatRooms([]); // Set empty array on error
      }
    };

    fetchRooms();
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(import.meta.env.VITE_API_URL);
      setSocket(newSocket);

      newSocket.emit('user_join', {
        userId: user.sub,
        userName: user.name
      });

      return () => newSocket.close();
    }
  }, [isAuthenticated, user]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        activeUsers,
        chatRooms,
        setChatRooms,
        currentRoom,
        setCurrentRoom,
        privateChats,
        setPrivateChats,
        sendPrivateMessage,
        sendGroupMessage,
        joinRoom,
        leaveRoom
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);