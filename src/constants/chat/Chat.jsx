import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import './chat.css';

const Chat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    inputRef.current?.focus();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      const newMessage = {
        text: inputText,
        sender: 'user',
        time: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      
      setTimeout(() => {
        const botMessage = {
          text: 'Hello player!',
          sender: 'bot',
          time: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 1000);
      
      setInputText('');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Game Chat</h3>
        <button onClick={onClose}>×</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="message-container">
            <span className="message-time">[{formatTime(msg.time)}]</span>
            <div className={`message-bubble ${msg.sender}`}>
              <span>{msg.sender === 'user' ? 'You' : 'Game'}: {msg.text}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="chat-input">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Press T to chat..."
          maxLength={256}
        />
        <button type="submit" className="send-button">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default Chat;