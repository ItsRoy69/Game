import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useChat } from "../../contexts/ChatContext";
import axios from "axios";
import Balloon from "../../components/balloon/balloon";
import GameControls from "../../constants/gamecontrols/GameControls";
import Chat from "../../constants/chat/Chat";
import backSound from "../../assets/audio/back.mp3";
import saveSound from "../../assets/audio/save.mp3";
import "./balloongame.css";

const BALLOON_COLORS = ["red", "blue", "yellow", "green", "black", "pink"];
const GAME_NAME = "balloonPopper";

const backAudio = new Audio(backSound);
const saveAudio = new Audio(saveSound);

const BalloonGame = ({
  isArenaMode = false,
  player,
  onScoreUpdate,
  gameActive: externalGameActive = false,
  isOpponentView = false,
  roomId,
  balloons: syncedBalloons,
  score: syncedScore = 0,
  gameDuration = 30,
  balloonSpeed = 1000,
  maxBalloons = 10
}) => {
  const navigate = useNavigate();
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const { socket } = useChat();
  const [score, setScore] = useState(isOpponentView ? syncedScore : 0);
  const [balloons, setBalloons] = useState([]);
  const [gameActive, setGameActive] = useState(externalGameActive);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [scorePopups, setScorePopups] = useState([]);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const gameLoop = useRef(null);
  const balloonSpawner = useRef(null);

  useEffect(() => {
    if (isOpponentView) {
      setScore(syncedScore);
    }
  }, [isOpponentView, syncedScore]);

  const syncGameState = useCallback(
    (newBalloons, currentScore) => {
      if (isArenaMode && !isOpponentView && socket) {
        socket.emit("game_state_update", {
          roomId,
          gameState: {
            balloons: newBalloons,
            score: currentScore,
          },
          from: player.userId,
        });
      }
    },
    [isArenaMode, isOpponentView, socket, roomId, player]
  );

  const updateBalloons = useCallback(
    (newBalloonsOrFn) => {
      setBalloons((prev) => {
        const newBalloons =
          typeof newBalloonsOrFn === "function"
            ? newBalloonsOrFn(prev)
            : newBalloonsOrFn;
        syncGameState(newBalloons, score);
        return newBalloons;
      });
    },
    [syncGameState, score]
  );

  useEffect(() => {
    if (isOpponentView && syncedBalloons) {
      setBalloons(syncedBalloons);
    }
  }, [isOpponentView, syncedBalloons]);

  useEffect(() => {
    if (isArenaMode) {
      setGameActive(externalGameActive);
    }
  }, [isArenaMode, externalGameActive]);

  useEffect(() => {
    if (isArenaMode && onScoreUpdate) {
      onScoreUpdate(score);
    }
  }, [score, isArenaMode, onScoreUpdate]);

  useEffect(() => {
    const fetchHighScore = async () => {
      if (!isAuthenticated || (!user && !player)) return;

      try {
        setIsLoading(true);
        const token = await getAccessTokenSilently();
        const API_BASE_URL = import.meta.env.VITE_API_URL;

        const userId = isArenaMode ? player?.userId : user?.sub;
        if (!userId) return;

        const response = await axios.get(
          `${API_BASE_URL}/api/users/${userId}/games/${GAME_NAME}/score`,
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
  }, [user, getAccessTokenSilently, isAuthenticated, isArenaMode, player]);

  const saveHighScore = async (newScore) => {
    if (!isAuthenticated || (!user && !isArenaMode)) return;

    try {
      const token = await getAccessTokenSilently();
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const response = await axios.post(
        `${API_BASE_URL}/api/users/${
          isArenaMode ? player.userId : user.sub
        }/games/${GAME_NAME}/score`,
        {
          gameName: GAME_NAME,
          score: newScore,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error saving high score:",
        error.response?.data || error.message
      );
      throw error;
    }
  };

  const handleBackClick = () => {
    if (!isArenaMode) {
      backAudio.play();
      navigate("/");
    }
  };

  const startGame = useCallback(() => {
    if (!isArenaMode) {
      saveAudio.play();
    }
    setGameActive(true);
    setScore(0);
    setTimeLeft(gameDuration);
    updateBalloons([]);
    setScorePopups([]);
    setShowFinalScore(false);
  }, [isArenaMode, updateBalloons, gameDuration]);

  const updateHighScore = useCallback(
    (newScore) => {
      if (newScore > highScore) {
        setHighScore(newScore);
        saveHighScore(newScore).catch((error) => {
          console.error("Failed to save high score:", error);
        });
      }
    },
    [highScore]
  );

  const exitGame = useCallback(() => {
    setGameActive(false);
    setShowFinalScore(true);
    updateHighScore(score);
    if (gameLoop.current) {
      clearInterval(gameLoop.current);
    }
    if (balloonSpawner.current) {
      clearInterval(balloonSpawner.current);
    }
  }, [score, updateHighScore]);

  const handleExitToHome = useCallback(() => {
    if (!isArenaMode) {
      backAudio.play();
      navigate("/");
    }
  }, [navigate, isArenaMode]);

  const popBalloon = useCallback(
    (id, shouldScore) => {
      if (isOpponentView) return;

      updateBalloons((prev) => prev.filter((balloon) => balloon.id !== id));

      if (shouldScore) {
        setScore((prev) => {
          const newScore = prev + 1;
          const balloon = balloons.find((b) => b.id === id);
          syncGameState(
            balloons.filter((b) => b.id !== id),
            newScore
          );

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
    [balloons, isOpponentView, updateBalloons, syncGameState]
  );

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
    if (gameActive && !isOpponentView) {
      balloonSpawner.current = setInterval(() => {
        updateBalloons((prev) => {
          if (prev.length >= maxBalloons) return prev;
          
          const newBalloon = {
            id: Math.random(),
            x: Math.random() * 80 + 10,
            y: 100,
            color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
          };
          return [...prev, newBalloon];
        });
      }, balloonSpeed);
    }

    return () => {
      if (balloonSpawner.current) {
        clearInterval(balloonSpawner.current);
      }
    };
  }, [gameActive, isOpponentView, updateBalloons, balloonSpeed, maxBalloons]);

  if (isLoading && !isArenaMode) {
    return <div className="loading">Loading game data...</div>;
  }

  return (
    <div
      className={`balloon-game ${isArenaMode ? "arena-mode" : ""} ${
        isOpponentView ? "opponent-view" : ""
      }`}
    >
      {!isArenaMode && (
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
      )}

      {showFinalScore && !isArenaMode && (
        <div className="final-score-overlay">
          <div className="minecraft-score">
            <h2>Game Over!</h2>
            <p className="score-text">Final Score: {score}</p>
            {score > highScore && (
              <p className="new-high-score">New High Score! 🏆</p>
            )}
            <div className="button-container">
              <button className="start-button-final" onClick={startGame}>
                ▶ Play Again
              </button>
              <button className="exit-button-final" onClick={handleExitToHome}>
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

      {!isArenaMode && (
        <GameControls
          score={score}
          gameActive={gameActive}
          onStartGame={startGame}
          onExitGame={exitGame}
          onChatToggle={() => setChatOpen((prev) => !prev)}
          chatOpen={chatOpen}
        />
      )}

      {chatOpen && !isArenaMode && <Chat onClose={() => setChatOpen(false)} />}

      {isArenaMode && (
        <div className="arena-stats">
          <div className="stats-item">
            <span className="stats-icon">⏰</span>
            <span>Time: {timeLeft}s</span>
          </div>
          <div className="stats-item">
            <span className="stats-icon">💎</span>
            <span>Score: {score}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalloonGame;