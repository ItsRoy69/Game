import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { Plus, Copy } from 'lucide-react';
import './chat.css';

const ChatRoomsList = ({ onSelectRoom }) => {
  const { chatRooms, joinRoom, createRoom } = useChat();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    try {
      const newRoom = await createRoom();
      handleRoomSelect(newRoom._id);
    } catch (error) {
      setError(error.message || 'Failed to create room');
    }
  };

  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      setError('Join code is required');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/chat/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ joinCode })
      });

      if (!response.ok) {
        throw new Error('Failed to join room');
      }

      const data = await response.json();
      handleRoomSelect(data.data._id);
      setJoinCode('');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="chat-rooms-list">
      <div className="rooms-header">
        <h3>Chat Rooms</h3>
        <button 
          className="create-room-btn"
          onClick={handleCreateRoom}
        >
          <Plus size={16} />
          New Room
        </button>
      </div>

      {/* Join by code input */}
      <div className="join-room-form">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Enter room code to join"
          className="join-code-input"
        />
        <button onClick={handleJoinByCode} className="join-btn">
          Join
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Room list */}
      {chatRooms.map((room) => (
        <div key={room._id} className="room-item">
          <div className="room-info">
            <span className="room-name">Room #{room.joinCode}</span>
            <div className="room-code">
              <button 
                onClick={() => copyJoinCode(room.joinCode)}
                className="copy-btn"
                title="Copy room code"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {chatRooms.length === 0 && (
        <div className="no-rooms">No chat rooms available</div>
      )}
    </div>
  );
};

export default ChatRoomsList;