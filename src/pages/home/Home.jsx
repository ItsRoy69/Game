import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import NavBar from "../../constants/navbar/NavBar";
import { Settings, Lock } from "lucide-react";
import axios from "axios";
import saveSound from "../../assets/audio/save.mp3";
import settingSound from "../../assets/audio/setting.mp3";
import "./home.css";

function Home() {
  const { isAuthenticated, user, loginWithRedirect, getAccessTokenSilently } =
    useAuth0();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameScores, setGameScores] = useState({});

  const saveAudio = new Audio(saveSound);
  const settingAudio = new Audio(settingSound);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated) {
        try {
          setIsLoading(true);
          const token = await getAccessTokenSilently();
          const API_BASE_URL = import.meta.env.VITE_API_URL;
  
          const userResponse = await axios.get(
            `${API_BASE_URL}/api/users/${user.sub}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setUserProfile(userResponse.data);
          const scoresResponse = await axios.get(
            `${API_BASE_URL}/api/users/${user.sub}/games/scores`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setGameScores(scoresResponse.data.gameScores || {});
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
  
    fetchUserProfile();
  }, [isAuthenticated, getAccessTokenSilently, user]);

  const isProfileComplete = (profile) => {
    if (!profile) return false;
    const requiredFields = [
      "gender",
      "datingPreferences",
      "about",
      "dateOfBirth",
      "photos",
      "favoriteGames",
    ];

    return requiredFields.every((field) => {
      const value = profile[field];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });
  };

  const handleSettingsClick = () => {
    settingAudio.play();
  };

  const handlePlayClick = () => {
    saveAudio.play();
  };

  const getHighScore = (gameName) => {
    return gameScores[gameName]?.highScore || 0;
  };

  if (isLoading) {
    return (
      <div className="home">
        <NavBar />
        <div className="home-container">
          <div className="loading-container">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <NavBar />
      <div className="home-container">
        {isAuthenticated ? (
          <>
            <div className="profile-card">
              <div className="profile-header">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="profile-avatar"
                />
                <div className="profile-info">
                  <h2>Welcome, {user.name}!</h2>
                  <p className="profile-email">{user.email}</p>
                </div>
                <Link to="/profilesettings" onClick={handleSettingsClick}>
                  <Settings size={24} className="minecraft-settings-icon" />
                </Link>
              </div>
            </div>

            <div className="games-section">
              <h2 className="games-title">Available Games</h2>
              <div className="game-grid">
                <div className="game-card">
                  <div className="game-card-header">
                    <h3>Balloon Popper</h3>
                  </div>
                  <p>Pop as many balloons as you can in 30 seconds!</p>
                  <div className="game-card-footer">
                    <span className="high-score">
                      High Score: {getHighScore("balloon-game")}
                    </span>
                    <div className="button-group">
                      <Link to="/balloongame">
                        <button
                          className="play-button"
                          onClick={handlePlayClick}
                        >
                          Play Now
                        </button>
                      </Link>
                      {isProfileComplete(userProfile) ? (
                        <Link
                          to="/challenges/balloon-game"
                          className="challenge-button"
                          onClick={handlePlayClick}
                        >
                          Challenge
                        </Link>
                      ) : (
                        <div
                          className="challenge-button locked"
                          title="Challenge"
                        >
                          Challenge{!isProfileComplete(userProfile) && (
                      <div className="lock-icon">
                        <Lock size={20} />
                      </div>
                    )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome to GameZ</h1>
            <p className="welcome-text">
              Please log in to access our amazing collection of games!
            </p>
            <button
              onClick={() => loginWithRedirect()}
              className="auth-button login-button"
            >
              Log In to Play
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
