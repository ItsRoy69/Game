import React, { useState, useRef, useEffect } from "react";
import { Send, Users, MessageSquare, X } from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth0 } from "@auth0/auth0-react";
import ChatRoomsList from "./ChatRoomsList";
import UsersList from "./UsersList";
import MessageList from "./MessageList";
import sendSound from "../../assets/audio/send.mp3";
import "./chat.css";

const Chat = ({ onClose, isArenaChat = false, opponent }) => {
  const [inputText, setInputText] = useState("");
  const [view, setView] = useState(isArenaChat ? "chat" : "rooms");
  const [selectedUser, setSelectedUser] = useState(isArenaChat ? opponent : null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const sendAudioRef = useRef(new Audio(sendSound));
  const { user } = useAuth0();
  const {
    currentRoom,
    sendPrivateMessage,
    sendGroupMessage,
    privateChats,
    roomMessages,
  } = useChat();

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentRoom, selectedUser]);

  useEffect(() => {
    if (isArenaChat && opponent) {
      setView('chat');
      setSelectedUser(opponent);
    }
  }, [isArenaChat, opponent]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      sendAudioRef.current.play().catch(console.error);

      if (selectedUser) {
        sendPrivateMessage(selectedUser.userId, inputText);
      } else if (currentRoom) {
        sendGroupMessage(currentRoom, inputText);
      }

      setInputText("");
      setError("");
    } catch (error) {
      setError("Failed to send message. Please try again.");
      console.error("Error sending message:", error);
    }
  };

  const getCurrentMessages = () => {
    if (selectedUser) {
      return privateChats.get(selectedUser.userId) || [];
    }
    if (currentRoom) {
      return roomMessages.get(currentRoom) || [];
    }
    return [];
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setView("chat");
    setError("");
  };

  const handleRoomSelect = () => {
    setSelectedUser(null);
    setView("chat");
    setError("");
  };

  const handleTabChange = (newView) => {
    setView(newView);
    setSelectedUser(null);
    setError("");
  };

  const renderContent = () => {
    switch (view) {
      case "rooms":
        return <ChatRoomsList onSelectRoom={handleRoomSelect} />;
      case "users":
        return <UsersList onSelectUser={handleUserSelect} />;
      case "chat":
        return (
          <MessageList
            messages={getCurrentMessages()}
            isPrivateChat={!!selectedUser}
            selectedUser={selectedUser}
            isArenaChat={isArenaChat}
          />
        );
      default:
        return null;
    }
  };

  const renderHeader = () => {
    if (isArenaChat) {
      return (
        <div className="chat-header arena-chat-header">
          <div className="chat-title">
            Chat with {opponent?.userName || "Opponent"}
          </div>
          <button onClick={onClose} className="close-button">
            <X size={16} />
          </button>
        </div>
      );
    }

    return (
      <div className="chat-header">
        <div className="chat-tabs">
          <button
            className={`tab ${view === "rooms" ? "active" : ""}`}
            onClick={() => handleTabChange("rooms")}
          >
            <MessageSquare size={16} />
            Rooms
          </button>
          <button
            className={`tab ${view === "users" ? "active" : ""}`}
            onClick={() => handleTabChange("users")}
          >
            <Users size={16} />
            Users
          </button>
        </div>
        <button onClick={onClose} className="close-button">
          <X size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className={`chat-panel ${isArenaChat ? 'arena-chat' : ''}`}>
      {renderHeader()}

      {error && <div className="error-message">{error}</div>}

      <div className="chat-content">{renderContent()}</div>

      {(view === "chat" || isArenaChat) && (currentRoom || selectedUser) && (
        <form onSubmit={handleSend} className="chat-input">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
            className="chat-input-field"
          />
          <button type="submit" className="send-button" disabled={!inputText.trim()}>
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
};

export default Chat;