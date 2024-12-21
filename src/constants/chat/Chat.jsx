import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import './chat.css'

const Chat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      setMessages([...messages, { text: inputText, sender: 'user', time: new Date() }]);
      setInputText('');
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Game Chat</h3>
        <button onClick={onClose}>×</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message-container ${msg.sender === 'user' ? 'user' : 'bot'}`}
          >
            <div className={`message-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
              <p>{msg.text}</p>
              <span className="message-time">
                {new Date(msg.time).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="send-button">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;