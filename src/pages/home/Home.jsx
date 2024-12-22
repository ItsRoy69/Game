import React from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import NavBar from "../../constants/navbar/NavBar";
import { Settings } from "lucide-react";
import saveSound from "../../assets/audio/save.mp3";
import settingSound from "../../assets/audio/setting.mp3";
import "./home.css";

function Home() {
  const { isAuthenticated, user, loginWithRedirect } = useAuth0();

  const saveAudio = new Audio(saveSound);
  const settingAudio = new Audio(settingSound);

  const handleSettingsClick = (e) => {
    settingAudio.play();
  };

  const handlePlayClick = () => {
    saveAudio.play();
  };

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
                  <h3>Balloon Popper</h3>
                  <p>Pop as many balloons as you can in 30 seconds!</p>
                  <div className="game-card-footer">
                    <span className="high-score">High Score: 0</span>
                    <div className="button-group">
                      <Link to="/balloongame">
                        <button
                          className="play-button"
                          onClick={handlePlayClick}
                        >
                          Play Now
                        </button>
                      </Link>
                      <Link to="/challenges">
                        <button
                          className="challenge-button"
                          onClick={handlePlayClick}
                        >
                          Challenge
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Add more game cards here */}
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
