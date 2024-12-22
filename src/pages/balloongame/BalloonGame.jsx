import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import Balloon from "../../components/balloon/balloon";
import GameControls from "../../constants/gamecontrols/GameControls";
import Chat from "../../constants/chat/Chat";
import backSound from "../../assets/audio/back.mp3";
import saveSound from "../../assets/audio/save.mp3";
import "./balloongame.css";

const BALLOON_COLORS = ["red", "blue", "yellow", "green", "black", "pink"];
const GAME_DURATION = 30;
const BALLOON_SPAWN_INTERVAL = 1000;
const GAME_NAME = "balloonPopper";

const backAudio = new Audio(backSound);
const saveAudio = new Audio(saveSound);

const BalloonGame = () => {
  const navigate = useNavigate();
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [scorePopups, setScorePopups] = useState([]);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const gameLoop = useRef(null);
  const balloonSpawner = useRef(null);

  useEffect(() => {
    const fetchHighScore = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setIsLoading(true);
        const token = await getAccessTokenSilently();
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        
        const response = await axios.get(
          `${API_BASE_URL}/api/users/${user.sub}/games/${GAME_NAME}/score`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        setHighScore(response.data.highScore);
      } catch (error) {
        console.error("Error fetching high score:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighScore();
  }, [user, getAccessTokenSilently, isAuthenticated]);

  // Save new high score to database
  const saveHighScore = async (newScore) => {
    if (!isAuthenticated || !user) return;
  
    try {
      const token = await getAccessTokenSilently();
      const API_BASE_URL = import.meta.env.VITE_API_URL;
  
      const response = await axios.post(
        `${API_BASE_URL}/api/users/${user.sub}/games/${GAME_NAME}/score`,  // Changed endpoint
        {
          gameName: GAME_NAME,
          score: newScore
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("Score saved successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error saving high score:", error.response?.data || error.message);
      throw error;
    }
  };

  const handleBackClick = () => {
    backAudio.play();
    navigate("/");
  };

  const startGame = useCallback(() => {
    saveAudio.play();
    setGameActive(true);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBalloons([]);
    setScorePopups([]);
    setShowFinalScore(false);
  }, []);

  const updateHighScore = useCallback(
    (newScore) => {
      if (newScore > highScore) {
        console.log('Attempting to save new high score:', {
          newScore,
          gameName: GAME_NAME,
          userId: user?.sub
        });
        setHighScore(newScore);
        saveHighScore(newScore).catch(error => {
          console.error('Failed to save high score:', error);
        });
      }
    },
    [highScore, user]
  );

  const exitGame = useCallback(() => {
    setGameActive(false);
    setShowFinalScore(true);
    updateHighScore(score);
  }, [score, updateHighScore]);

  const handleExitToHome = useCallback(() => {
    backAudio.play();
    navigate("/");
  }, [navigate]);

  const popBalloon = useCallback(
    (id, shouldScore) => {
      setBalloons((prev) => prev.filter((balloon) => balloon.id !== id));

      if (shouldScore) {
        setScore((prev) => {
          const newScore = prev + 1;
          const balloon = balloons.find((b) => b.id === id);

          if (balloon) {
            const popup = {
              id: Math.random(),
              x: balloon.x,
              y: balloon.y,
              text: "+1",
            };

            setScorePopups((prev) => [...prev, popup]);
            setTimeout(() => {
              setScorePopups((prev) => prev.filter((p) => p.id !== popup.id));
            }, 1000);
          }

          return newScore;
        });
      }
    },
    [balloons]
  );

  // Game timer
  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      gameLoop.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            exitGame();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (gameLoop.current) {
        clearInterval(gameLoop.current);
      }
    };
  }, [gameActive, timeLeft, exitGame]);

  useEffect(() => {
    if (gameActive) {
      balloonSpawner.current = setInterval(() => {
        const newBalloon = {
          id: Math.random(),
          x: Math.random() * 80 + 10,
          y: 100,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
        };
        setBalloons((prev) => [...prev, newBalloon]);
      }, BALLOON_SPAWN_INTERVAL);
    }

    return () => {
      if (balloonSpawner.current) {
        clearInterval(balloonSpawner.current);
      }
    };
  }, [gameActive]);

  if (isLoading) {
    return <div className="loading">Loading game data...</div>;
  }

  return (
    <div className="balloon-game">
      <div className="game-info">
        <div className="game-header">
          <button className="back-button" onClick={handleBackClick}>
            ⬅ Back
          </button>
          <h1 className="game-title">Balloon Popper</h1>
        </div>
        <div className="stats">
          <div className="stats-item">
            <span className="stats-icon">⏰</span>
            <span>Time: {timeLeft}s</span>
          </div>
          <div className="stats-item">
            <span className="stats-icon">💎</span>
            <span>Score: {score}</span>
          </div>
          <div className="stats-item">
            <span className="stats-icon">👑</span>
            <span>High Score: {highScore}</span>
          </div>
        </div>
      </div>

      {showFinalScore && (
        <div className="final-score-overlay">
          <div className="minecraft-score">
            <h2>Game Over!</h2>
            <p className="score-text">Final Score: {score}</p>
            {score > highScore && (
              <p className="new-high-score">New High Score! 🏆</p>
            )}
            <div className="button-container">
              <button className="start-button" onClick={startGame}>
                ▶ Play Again
              </button>
              <button className="exit-button" onClick={handleExitToHome}>
                ⬅ Exit to Home
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-area">
        {balloons.map((balloon) => (
          <Balloon key={balloon.id} {...balloon} onPop={popBalloon} />
        ))}

        {scorePopups.map((popup) => (
          <div
            key={popup.id}
            className="score-popup"
            style={{
              left: `${popup.x}%`,
              bottom: `${popup.y}%`,
            }}
          >
            {popup.text}
          </div>
        ))}
      </div>

      <GameControls
        score={score}
        gameActive={gameActive}
        onStartGame={startGame}
        onExitGame={exitGame}
        onChatToggle={() => setChatOpen((prev) => !prev)}
        chatOpen={chatOpen}
      />

      {chatOpen && <Chat onClose={() => setChatOpen(false)} />}
    </div>
  );
};

export default BalloonGame;