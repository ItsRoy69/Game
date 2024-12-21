import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import './chat.css';

const UsersList = ({ onSelectUser }) => {
  const { activeUsers } = useChat();

  return (
    <div className="users-list">
      {activeUsers.map((user) => (
        <div
          key={user.userId}
          className="user-item"
          onClick={() => onSelectUser(user)}
        >
          <div className="user-avatar">
            {user.userName.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{user.userName}</span>
            <span className="user-status">Online</span>
          </div>
        </div>
      ))}
      {activeUsers.length === 0 && (
        <div className="no-users">No active users</div>
      )}
    </div>
  );
};


export default UsersList;