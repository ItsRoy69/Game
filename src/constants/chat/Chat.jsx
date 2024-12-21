import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, MessageSquare, X } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth0 } from '@auth0/auth0-react';
import ChatRoomsList from './ChatRoomsList';
import UsersList from './UsersList';
import MessageList from './MessageList';
import './Chat.css';

const Chat = ({ onClose }) => {
  const [inputText, setInputText] = useState('');
  const [view, setView] = useState('rooms');
  const [selectedUser, setSelectedUser] = useState(null);
  const inputRef = useRef(null);
  const { user } = useAuth0();
  const {
    currentRoom,
    sendPrivateMessage,
    sendGroupMessage,
    privateChats
  } = useChat();

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentRoom, selectedUser]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (selectedUser) {
      sendPrivateMessage(selectedUser.userId, inputText);
    } else if (currentRoom) {
      sendGroupMessage(currentRoom, inputText);
    }

    setInputText('');
  };
  
  const renderContent = () => {
    switch (view) {
      case "rooms":
        return <ChatRoomsList onSelectRoom={() => setView("chat")} />;
      case "users":
        return (
          <UsersList
            onSelectUser={(user) => {
              setSelectedUser(user);
              setView("chat");
            }}
          />
        );
      case "chat":
        return (
          <MessageList
            messages={selectedUser ? privateChats.get(selectedUser.userId) : []}
            isPrivateChat={!!selectedUser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-tabs">
          <button
            className={`tab ${view === "rooms" ? "active" : ""}`}
            onClick={() => setView("rooms")}
          >
            <MessageSquare size={16} />
            Rooms
          </button>
          <button
            className={`tab ${view === "users" ? "active" : ""}`}
            onClick={() => setView("users")}
          >
            <Users size={16} />
            Users
          </button>
        </div>
        <button onClick={onClose} className="close-button">
          <X size={16} />
        </button>
      </div>

      <div className="chat-content">{renderContent()}</div>

      {view === "chat" && (
        <form onSubmit={handleSend} className="chat-input">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
          />
          <button type="submit" className="send-button">
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
};

export default Chat;
