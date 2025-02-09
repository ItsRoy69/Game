import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import NavBar from "../../constants/navbar/NavBar";
import UserProfileModal from "../../components/userprofilemodal/UserProfileModal";
import "./gamechallenges.css";

function GameChallenges() {
  const [users, setUsers] = useState([]);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [ignoreGenderPreferences, setIgnoreGenderPreferences] = useState(false);
  const { gameId } = useParams();
  const { getAccessTokenSilently, user: currentUser } = useAuth0();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      console.log("Fetching current user profile for:", currentUser.sub);
      try {
        const token = await getAccessTokenSilently();
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await axios.get(
          `${API_BASE_URL}/api/users/${currentUser.sub}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Current user profile fetched:", response.data);
        setCurrentUserProfile(response.data);
      } catch (error) {
        console.error("Error fetching current user profile:", error);
        setError("Failed to load user profile");
      }
    };

    fetchCurrentUserProfile();
  }, [getAccessTokenSilently, currentUser.sub]);

  useEffect(() => {
    const fetchUsers = async () => {
      console.log("Starting to fetch and filter users");
      console.log("Current user profile state:", currentUserProfile);
  
      setIsLoading(true);
      try {
        const token = await getAccessTokenSilently();
        const API_BASE_URL = import.meta.env.VITE_API_URL;
  
        const challengesResponse = await axios.get(
          `${API_BASE_URL}/api/challenges/${currentUser.sub}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        
        const connectedUserIds = new Set(
          challengesResponse.data
            .filter(challenge => 
              challenge.status === "accepted" &&
              challenge.gameId === gameId)
            .map(challenge => 
              challenge.challengerId === currentUser.sub 
                ? challenge.challengedId 
                : challenge.challengerId
            )
        );
  
        const response = await axios.get(`${API_BASE_URL}/api/users`, {
          params: {
            page: 1,
            limit: 50,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        console.log("All users fetched:", response.data.users.length);
  
        const filteredUsers = response.data.users.filter((potentialMatch) => {
          if (connectedUserIds.has(potentialMatch.auth0Id)) {
            return false;
          }
  
          if (potentialMatch.auth0Id === currentUser.sub) {
            return false;
          }
  
          const profileFields = {
            currentUserGender: !!currentUserProfile?.gender,
            currentUserPreferences: !!currentUserProfile?.datingPreferences,
            currentUserDOB: !!currentUserProfile?.dateOfBirth,
            currentUserAgeRange: !!currentUserProfile?.datingAgeRange,
            matchGender: !!potentialMatch.gender,
            matchPreferences: !!potentialMatch.datingPreferences,
            matchDOB: !!potentialMatch.dateOfBirth,
            matchAgeRange: !!potentialMatch.datingAgeRange,
          };
  
          if (Object.values(profileFields).some((field) => !field)) {
            return false;
          }

          // Skip gender preference check if ignoreGenderPreferences is true
          if (!ignoreGenderPreferences) {
            const userLikesPotentialMatch = currentUserProfile.datingPreferences.includes(
              potentialMatch.gender
            );
            const potentialMatchLikesUser = potentialMatch.datingPreferences.includes(
              currentUserProfile.gender
            );

            if (!userLikesPotentialMatch || !potentialMatchLikesUser) {
              return false;
            }
          }
  
          const matchAge = calculateAge(potentialMatch.dateOfBirth);
          const userAge = calculateAge(currentUserProfile.dateOfBirth);
  
          const withinUserPreferences =
            matchAge >= currentUserProfile.datingAgeRange.min &&
            matchAge <= currentUserProfile.datingAgeRange.max;
  
          const withinMatchPreferences =
            userAge >= potentialMatch.datingAgeRange.min &&
            userAge <= potentialMatch.datingAgeRange.max;
  
          if (!withinUserPreferences || !withinMatchPreferences) {
            return false;
          }
  
          return true;
        });
  
        console.log(
          `Filtering complete. Found ${filteredUsers.length} matches`
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };
  
    if (currentUserProfile) {
      fetchUsers();
    }
  }, [getAccessTokenSilently, currentUser.sub, currentUserProfile, gameId, ignoreGenderPreferences]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleChallenge = async (challengedUser, event) => {
    event.stopPropagation();

    try {
      const token = await getAccessTokenSilently();
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const response = await axios.post(
        `${API_BASE_URL}/api/challenges`,
        {
          challengerId: currentUser.sub,
          challengedId: challengedUser.auth0Id,
          gameId: gameId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Challenge sent successfully:", response.data);
      alert("Challenge sent successfully!");
    } catch (error) {
      console.error("Error sending challenge:", error);
      alert("Failed to send challenge. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="challenges-page">
        <NavBar />
        <div className="challenges-container">
          <div className="loading">Loading players...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="challenges-page">
        <NavBar />
        <div className="challenges-container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="challenges-page">
      <NavBar />
      <div className="challenges-container">
        <div className="challenges-header">
          <h2 className="challenges-title">Challenge Players</h2>
          <div className="filter-controls">
            <label className="gender-filter-label">
              <input
                type="checkbox"
                checked={ignoreGenderPreferences}
                onChange={(e) => setIgnoreGenderPreferences(e.target.checked)}
                className="gender-filter-checkbox"
              />
              Match with all players
            </label>
          </div>
        </div>
        {users.length === 0 ? (
          <div className="no-matches">
            No players found matching your preferences. Try updating your
            profile settings or enabling "Match with all players"!
          </div>
        ) : (
          <div className="players-grid">
            {users.map((user) => (
              <div
                key={user.auth0Id}
                className="player-card"
                onClick={() => setSelectedUser(user)}
              >
                <img
                  src={user.picture || "default-avatar.png"}
                  alt={user.name}
                  className="player-avatar"
                />
                <div className="player-info">
                  <h3>{user.name}</h3>
                  {user.dateOfBirth && (
                    <p className="player-age">
                      Age: {calculateAge(user.dateOfBirth)}
                    </p>
                  )}
                  <p className="player-stats">
                    High Score:{" "}
                    {(user.gameScores && user.gameScores[gameId]?.highScore) ||
                      0}
                  </p>
                  {user.about && <p className="player-about">{user.about}</p>}
                </div>
                <button
                  className="challenge-player-button"
                  onClick={(e) => handleChallenge(user, e)}
                >
                  Send Challenge
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedUser && (
          <UserProfileModal
            user={{
              ...selectedUser,
              age: calculateAge(selectedUser.dateOfBirth),
              gameScores: {
                ...(selectedUser.gameScores || {}),
                highScore: selectedUser.gameScores?.[gameId]?.highScore || 0,
                gamesPlayed:
                  selectedUser.gameScores?.[gameId]?.gamesPlayed || 0,
              },
            }}
            onClose={() => setSelectedUser(null)}
            onChallenge={(e) => handleChallenge(selectedUser, e)}
          />
        )}
      </div>
    </div>
  );
}

export default GameChallenges;