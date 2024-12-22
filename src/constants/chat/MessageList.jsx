import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "./chat.css";

const MessageList = ({ messages = [], isPrivateChat, selectedUser }) => {
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [error, setError] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleEnterArena = () => {
    console.log('Selected User:', selectedUser);
    navigate('/arena', { state: { opponent: selectedUser } });
  };
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!Array.isArray(messages)) {
    return <div className="loading">Loading messages...</div>;
  }

  return (
    <div className="chat-messages">
      {isPrivateChat && (
        <div className="arena-button-container">
          <button 
            className="enter-arena-button"
            onClick={handleEnterArena}
          >
            Enter Arena
          </button>
        </div>
      )}
      
      {messages.map((msg, index) => {
        const isCurrentUser = msg.sender === user?.sub;
        return (
          <div key={msg._id || index} className="message-container">
            <div className={`message-bubble ${isCurrentUser ? "user" : "bot"}`}>
              <span>{msg.content}</span>
              <div className="message-time">{formatTime(msg.createdAt)}</div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;