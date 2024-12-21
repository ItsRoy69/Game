import React, { useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { Plus } from 'lucide-react';
import './chat.css';
import { useAuth0 } from '@auth0/auth0-react';

const ChatRoomsList = ({ onSelectRoom }) => {
  const { chatRooms, setChatRooms, joinRoom } = useChat();
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setChatRooms(data);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        setChatRooms([]); // Set empty array on error to avoid undefined state
      }
    };

    fetchRooms();
  }, [setChatRooms, getAccessTokenSilently]);

  const handleRoomSelect = (roomId) => {
    joinRoom(roomId);
    onSelectRoom();
  };

  return (
    <div className="chat-rooms-list">
      <div className="rooms-header">
        <h3>Chat Rooms</h3>
        <button className="create-room-btn">
          <Plus size={16} />
          New Room
        </button>
      </div>
      
      {chatRooms.map((room) => (
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
      ))}
      
      {chatRooms.length === 0 && (
        <div className="no-rooms">No chat rooms available</div>
      )}
    </div>
  );
};

export default ChatRoomsList;