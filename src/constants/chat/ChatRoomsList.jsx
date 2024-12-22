import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import { Plus } from 'lucide-react';
import './chat.css';
import { useAuth0 } from '@auth0/auth0-react';

const ChatRoomsList = ({ onSelectRoom }) => {
  const { chatRooms, joinRoom } = useChat();
  const { isAuthenticated } = useAuth0();

  const handleRoomSelect = (roomId) => {
    joinRoom(roomId);
    if (onSelectRoom) onSelectRoom();
  };

  if (!isAuthenticated) {
    return <div className="chat-rooms-list">Please log in to view chat rooms</div>;
  }

  // Ensure chatRooms is an array
  const rooms = Array.isArray(chatRooms) ? chatRooms : [];

  return (
    <div className="chat-rooms-list">
      <div className="rooms-header">
        <h3>Chat Rooms</h3>
        <button className="create-room-btn">
          <Plus size={16} />
          New Room
        </button>
      </div>
      
      {rooms.length > 0 ? (
        rooms.map((room) => (
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