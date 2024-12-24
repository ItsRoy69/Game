import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import io from "socket.io-client";
import { useAuth0 } from "@auth0/auth0-react";
import messageSound from "../assets/audio/message.mp3";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState(new Set());
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(() => {
    const savedRoom = localStorage.getItem("currentRoom");
    return savedRoom ? JSON.parse(savedRoom) : null;
  });
  const [privateChats, setPrivateChats] = useState(new Map());
  const [roomMessages, setRoomMessages] = useState(new Map());
  const [pendingMessages, setPendingMessages] = useState(new Map());
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const notificationSound = useRef(new Audio(messageSound));

  useEffect(() => {
    if (currentRoom) {
      localStorage.setItem("currentRoom", JSON.stringify(currentRoom));
    } else {
      localStorage.removeItem("currentRoom");
    }
  }, [currentRoom]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsConnecting(true);
      const newSocket = io(import.meta.env.VITE_API_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          userId: user.sub,
        },
      });

      newSocket.on("connect", () => {
        setIsConnecting(false);
        setError(null);

        newSocket.emit("user_join", {
          userId: user.sub,
          userName: user.name,
        });

        const savedRoom = localStorage.getItem("currentRoom");
        if (savedRoom) {
          const roomId = JSON.parse(savedRoom);
          joinRoom(roomId).catch((err) => {
            console.error("Failed to rejoin room:", err);
            localStorage.removeItem("currentRoom");
          });
        }
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setError("Failed to connect to chat server");
        setIsConnecting(false);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setError("Disconnected from chat server");
      });

      newSocket.on("user_connected", (userId) => {
        setConnectedUsers((prev) => new Set([...prev, userId]));
      });

      newSocket.on("user_disconnected", (userId) => {
        setConnectedUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      newSocket.on("active_users", (users) => {
        const uniqueUsers = users.reduce((acc, current) => {
          if (
            !acc.find((user) => user.userId === current.userId) &&
            current.userId !== user?.sub
          ) {
            acc.push(current);
          }
          return acc;
        }, []);
        setActiveUsers(uniqueUsers);
        setConnectedUsers(new Set(uniqueUsers.map((u) => u.userId)));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!socket) return;

    const playMessageSound = () => {
      try {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play().catch((error) => {
          console.error("Error playing message sound:", error);
        });
      } catch (error) {
        console.error("Error with message sound:", error);
      }
    };

    const handlePrivateMessage = (data) => {
      if (data.from !== user?.sub) {
        playMessageSound();
      }

      setPrivateChats((prev) => {
        const chatId = data.from || data.to;
        const currentChat = prev.get(chatId) || [];

        if (data.tempId && pendingMessages.has(data.tempId)) {
          const updatedChat = currentChat.map((msg) =>
            msg._id === data.tempId ? data.message : msg
          );
          const newChats = new Map(prev);
          newChats.set(chatId, updatedChat);

          setPendingMessages((prev) => {
            const newPending = new Map(prev);
            newPending.delete(data.tempId);
            return newPending;
          });

          return newChats;
        }

        if (data.from !== user?.sub) {
          if (!currentChat.some((msg) => msg._id === data.message._id)) {
            const updatedChat = [...currentChat, data.message];
            const newChats = new Map(prev);
            newChats.set(chatId, updatedChat);
            return newChats;
          }
        }

        return prev;
      });
    };
    const handleGroupMessage = (data) => {
      if (data.from !== user?.sub) {
        playMessageSound();
      }

      setRoomMessages((prev) => {
        const currentMessages = prev.get(data.roomId) || [];

        if (data.tempId && pendingMessages.has(data.tempId)) {
          const updatedMessages = currentMessages.map((msg) =>
            msg._id === data.tempId ? data.message : msg
          );
          const newMessages = new Map(prev);
          newMessages.set(data.roomId, updatedMessages);

          setPendingMessages((prev) => {
            const newPending = new Map(prev);
            newPending.delete(data.tempId);
            return newPending;
          });

          return newMessages;
        }

        if (!currentMessages.some((msg) => msg._id === data.message._id)) {
          const updatedMessages = [...currentMessages, data.message];
          const newMessages = new Map(prev);
          newMessages.set(data.roomId, updatedMessages);
          return newMessages;
        }

        return prev;
      });
    };

    const handleRoomJoined = (data) => {
      setRoomMessages((prev) => {
        const newMessages = new Map(prev);
        newMessages.set(data.roomId, data.messages);
        return newMessages;
      });
    };

    const handleRoomExpired = (data) => {
      if (currentRoom === data.roomId) {
        setCurrentRoom(null);
        localStorage.removeItem("currentRoom");
        setError("This room has expired");
      }
    };

    const handleUserJoinedRoom = (data) => {
      setRoomMessages((prev) => {
        const currentMessages = prev.get(data.roomId) || [];
        const systemMessage = {
          _id: `system_${Date.now()}`,
          content: `${data.userName} joined the room`,
          type: "system",
          createdAt: new Date().toISOString(),
        };
        const newMessages = new Map(prev);
        newMessages.set(data.roomId, [...currentMessages, systemMessage]);
        return newMessages;
      });
    };

    socket.on("private_message", handlePrivateMessage);
    socket.on("group_message", handleGroupMessage);
    socket.on("room_joined", handleRoomJoined);
    socket.on("room_expired", handleRoomExpired);
    socket.on("user_joined_room", handleUserJoinedRoom);

    return () => {
      socket.off("private_message", handlePrivateMessage);
      socket.off("group_message", handleGroupMessage);
      socket.off("room_joined", handleRoomJoined);
      socket.off("room_expired", handleRoomExpired);
      socket.off("user_joined_room", handleUserJoinedRoom);
    };
  }, [socket, user, currentRoom, pendingMessages]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!isAuthenticated) return;

      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: "openid profile email",
          },
        });

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/chat/rooms`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setChatRooms(data.data?.rooms || []);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setError("Failed to fetch chat rooms");
        setChatRooms([]);
      }
    };

    fetchRooms();
  }, [isAuthenticated, getAccessTokenSilently]);

  const createRoom = async (roomData) => {
    if (!isAuthenticated) return;

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: "openid profile email",
        },
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/rooms`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(roomData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setChatRooms((prevRooms) => [...prevRooms, data.data]);
      return data.data;
    } catch (error) {
      console.error("Error creating room:", error);
      setError("Failed to create room");
      throw error;
    }
  };

  const joinRoom = async (roomId) => {
    if (!socket || !isAuthenticated) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/messages/room/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch messages");
      }

      if (currentRoom) {
        socket.emit("leave_room", { roomId: currentRoom, userId: user.sub });
      }

      socket.emit("join_room", { roomId, userId: user.sub });
      setCurrentRoom(roomId);
      setRoomMessages((prev) => {
        const newMessages = new Map(prev);
        newMessages.set(roomId, data.data.messages);
        return newMessages;
      });

      return data.data.messages;
    } catch (error) {
      console.error("Error joining room:", error);
      setError("Failed to join room");
      throw error;
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit("leave_room", { roomId, userId: user?.sub });
      setCurrentRoom(null);
      localStorage.removeItem("currentRoom");

      setRoomMessages((prev) => {
        const newMessages = new Map(prev);
        newMessages.delete(roomId);
        return newMessages;
      });
    }
  };

  const sendPrivateMessage = (recipientId, message) => {
    if (!socket || !isAuthenticated) return;

    const tempId = `temp_${Date.now()}`;
    const messageData = {
      to: recipientId,
      message,
      from: user.sub,
      tempId,
    };

    socket.emit("private_message", messageData);

    setPendingMessages((prev) => {
      const newPending = new Map(prev);
      newPending.set(tempId, true);
      return newPending;
    });

    setPrivateChats((prev) => {
      const currentChat = prev.get(recipientId) || [];
      const newMessage = {
        _id: tempId,
        content: message,
        sender: user.sub,
        recipient: recipientId,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      const updatedChat = [...currentChat, newMessage];
      const newChats = new Map(prev);
      newChats.set(recipientId, updatedChat);
      return newChats;
    });
  };

  const sendGroupMessage = (roomId, message) => {
    if (!socket || !isAuthenticated) return;

    const tempId = `temp_${Date.now()}`;
    const messageData = {
      roomId,
      message,
      from: user.sub,
      tempId,
    };

    socket.emit("group_message", messageData);

    setPendingMessages((prev) => {
      const newPending = new Map(prev);
      newPending.set(tempId, true);
      return newPending;
    });

    setRoomMessages((prev) => {
      const currentMessages = prev.get(roomId) || [];
      const newMessage = {
        _id: tempId,
        content: message,
        sender: user.sub,
        roomId,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      const updatedMessages = [...currentMessages, newMessage];
      const newMessages = new Map(prev);
      newMessages.set(roomId, updatedMessages);
      return newMessages;
    });
  };

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
        leaveRoom,
        createRoom,
        roomMessages,
        setRoomMessages,
        isConnecting,
        error,
        connectedUsers,
        setConnectedUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
