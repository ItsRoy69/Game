import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import NavBar from "../../constants/navbar/NavBar";
import "./gamechallenges.css";

function GameChallenges() {
  const [users, setUsers] = useState([]);
  const { gameId } = useParams();
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await getAccessTokenSilently();
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${API_BASE_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [getAccessTokenSilently]);

  return (
    <div className="challenges-page">
      <NavBar />
      <div className="challenges-container">
        <h2 className="challenges-title">Challenge Players</h2>
        <div className="players-grid">
          {users.map((user) => (
            <div key={user.auth0Id} className="player-card">
              <img src={user.picture} alt={user.name} className="player-avatar" />
              <div className="player-info">
                <h3>{user.name}</h3>
                <p className="player-stats">High Score: {user.highScore || 0}</p>
              </div>
              <button className="challenge-player-button">
                Send Challenge
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GameChallenges;