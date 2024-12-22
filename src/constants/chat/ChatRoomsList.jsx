import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { Plus, Copy, Lock, Globe } from 'lucide-react';
import './chat.css';
import { useAuth0 } from '@auth0/auth0-react';

const ChatRoomsList = ({ onSelectRoom }) => {
  const { chatRooms, joinRoom, createRoom } = useChat();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomType, setRoomType] = useState('public');
  const { getAccessTokenSilently } = useAuth0();

  const handleRoomSelect = async (roomId) => {
    try {
      await joinRoom(roomId);
      onSelectRoom(roomId);
    } catch (error) {
      setError(error.message || 'Failed to join room');
    }
  };

  const handleCreateRoom = async () => {
    try {
      const newRoom = await createRoom({ type: roomType });
      handleRoomSelect(newRoom._id);
      setShowCreateModal(false);
      setRoomType('public');
    } catch (error) {
      setError(error.message || 'Failed to create room');
    }
  };

  const copyJoinCode = (code, event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(code);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      setError('Join code is required');
      return;
    }
  
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: "openid profile email",
        },
      });
  
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ joinCode })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join room');
      }
  
      const data = await response.json();
      handleRoomSelect(data.data._id);
      setJoinCode('');
    } catch (error) {
      console.error('Error joining room:', error);
      setError(error.message || 'Failed to join room');
    }
  };

  const publicRooms = chatRooms.filter(room => room.type === 'public');
  const privateRooms = chatRooms.filter(room => room.type === 'private');

  return (
    <div className="chat-rooms-list">
      <div className="rooms-header">
        <h3>Chat Rooms</h3>
        <button 
          className="create-room-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          New Room
        </button>
      </div>

      <div className="join-room-form">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Enter room code"
          className="join-code-input"
        />
        <button onClick={handleJoinByCode} className="join-btn">
          Join Room
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Public Rooms Section */}
      <div className="rooms-section">
        <h4 className="section-title">
          <Globe size={16} />
          Public Rooms
        </h4>
        {publicRooms.map((room) => (
          <div 
            key={room._id} 
            className="room-item"
            onClick={() => handleRoomSelect(room._id)}
          >
            <div className="room-info">
              <span className="room-id">Room #{room.joinCode}</span>
            </div>
          </div>
        ))}
        {publicRooms.length === 0 && (
          <div className="no-rooms">No public rooms available</div>
        )}
      </div>

      {/* Private Rooms Section */}
      <div className="rooms-section">
        <h4 className="section-title">
          <Lock size={16} />
          Private Rooms
        </h4>
        {privateRooms.map((room) => (
          <div 
            key={room._id} 
            className="room-item"
            onClick={() => handleRoomSelect(room._id)}
          >
            <div className="room-info">
              <span className="room-id">Room #{room.joinCode}</span>
              <button 
                onClick={(e) => copyJoinCode(room.joinCode, e)}
                className="copy-btn"
                title="Copy room code"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        ))}
        {privateRooms.length === 0 && (
          <div className="no-rooms">No private rooms available</div>
        )}
      </div>

      {/* Simplified Create Room Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Room</h3>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="modal-input"
            >
              <option value="public">Public Room</option>
              <option value="private">Private Room</option>
            </select>
            <div className="modal-buttons">
              <button onClick={handleCreateRoom} className="create-btn">
                Create Room
              </button>
              <button onClick={() => setShowCreateModal(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoomsList;