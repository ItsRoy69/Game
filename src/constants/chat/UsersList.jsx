import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useChat } from "../../contexts/ChatContext";
import "./chat.css";

const UsersList = ({ onSelectUser }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const { activeUsers, connectedUsers } = useChat();
  const [challengeConnectedUsers, setChallengeConnectedUsers] = useState([]);

  useEffect(() => {
    const fetchChallengeUsers = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: "openid profile email",
          },
        });

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/challenges/${
            user.sub
          }?status=accepted`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch challenges");
        }

        const challenges = await response.json();

        const connectedUserIds = new Set();
        challenges.forEach((challenge) => {
          if (challenge.challengerId === user.sub) {
            connectedUserIds.add(challenge.challengedId);
          } else {
            connectedUserIds.add(challenge.challengerId);
          }
        });

        const challengeUsers = activeUsers.filter(
          (activeUser) =>
            connectedUserIds.has(activeUser.userId) &&
            connectedUsers.has(activeUser.userId)
        );

        setChallengeConnectedUsers(challengeUsers);
      } catch (error) {
        console.error("Error fetching challenge users:", error);
      }
    };

    if (user?.sub) {
      fetchChallengeUsers();
    }
  }, [user, activeUsers, connectedUsers, getAccessTokenSilently]);

  return (
    <div className="users-list">
      {challengeConnectedUsers.map((user) => (
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
      {challengeConnectedUsers.length === 0 && (
        <div className="no-users">No connected challenge users</div>
      )}
    </div>
  );
};

export default UsersList;
