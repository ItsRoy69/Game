import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { Plus } from 'lucide-react';
import './chat.css';
import { useAuth0 } from '@auth0/auth0-react';

const ChatRoomsList = ({ onSelectRoom }) => {
  const { chatRooms, joinRoom, createRoom } = useChat();
  const { isAuthenticated } = useAuth0();
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [error, setError] = useState('');

  const handleRoomSelect = (roomId) => {
    joinRoom(roomId);
    if (onSelectRoom) onSelectRoom();
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setError('Room name is required');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      const newRoom = await createRoom({
        name: newRoomName,
        type: 'public'
      });
      setNewRoomName('');
      handleRoomSelect(newRoom._id);
    } catch (error) {
      setError(error.message || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="chat-rooms-list">Please log in to view chat rooms</div>;
  }

  return (
    <div className="chat-rooms-list">
      <div className="rooms-header">
        <h3>Chat Rooms</h3>
        <button 
          className="create-room-btn"
          onClick={() => setNewRoomName('')}
          disabled={isCreating}
        >
          <Plus size={16} />
          New Room
        </button>
      </div>

      {/* Room creation form */}
      {newRoomName !== null && (
        <div className="room-creation-form">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Enter room name"
            className="room-name-input"
          />
          {error && <div className="error-message">{error}</div>}
          <div className="form-buttons">
            <button 
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="create-btn"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
            <button 
              onClick={() => setNewRoomName(null)}
              disabled={isCreating}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Room list */}
      {Array.isArray(chatRooms) && chatRooms.length > 0 ? (
        chatRooms.map((room) => (
          <div
            key={room._id}
            className="room-item"
            onClick={() => handleRoomSelect(room._id)}
          >
            <div className="room-info">
              <span className="room-name">{room.name}</span>
              <span className="room-type">{room.type}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="no-rooms">No chat rooms available</div>
      )}
    </div>
  );
};

export default ChatRoomsList;