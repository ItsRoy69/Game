import React, { useRef, useEffect, useState } from 'react';
import './chat.css';
import { useAuth0 } from '@auth0/auth0-react';
// In MessageList.jsx, update to handle the data structure:
const MessageList = ({ messages = [], isPrivateChat }) => {
  const messagesEndRef = useRef(null);
  const { user } = useAuth0();
  
  // Add error state
  const [error, setError] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!Array.isArray(messages)) {
    return <div className="loading">Loading messages...</div>;
  }

  return (
    <div className="messages-container">
      {messages.map((msg, index) => (
        <div
          key={msg._id || index}
          className={`message ${msg.sender === user.auth0Id ? 'sent' : 'received'}`}
        >
          <div className="message-content">
            <span className="message-text">{msg.content}</span>
            <span className="message-time">{formatTime(msg.createdAt)}</span>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;