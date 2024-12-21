import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Balloon from '../../components/balloon/balloon';
import GameControls from '../../constants/gamecontrols/GameControls';
import Chat from '../../constants/chat/Chat';
import backSound from '../../assets/audio/back.mp3';
import saveSound from '../../assets/audio/save.mp3';
import './balloongame.css';

const BALLOON_COLORS = ["red", "blue", "yellow", "green", "black", "pink"];
const GAME_DURATION = 30;
const BALLOON_SPAWN_INTERVAL = 1000;

const backAudio = new Audio(backSound);
const saveAudio = new Audio(saveSound);

const BalloonGame = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [scorePopups, setScorePopups] = useState([]);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('balloonGameHighScore')) || 0
  );

  const gameLoop = useRef(null);
  const balloonSpawner = useRef(null);

  const handleBackClick = () => {
    backAudio.play();
    navigate('/');
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

  const exitGame = useCallback(() => {
    setGameActive(false);
    setShowFinalScore(true);
  }, []);

  const handleExitToHome = useCallback(() => {
    backAudio.play();
    navigate('/');
  }, [navigate]);

  const updateHighScore = useCallback((newScore) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('balloonGameHighScore', newScore.toString());
    }
  }, [highScore]);

  const popBalloon = useCallback((id, shouldScore) => {
    setBalloons(prev => prev.filter(balloon => balloon.id !== id));

    if (shouldScore) {
      setScore(prev => {
        const newScore = prev + 1;
        const balloon = balloons.find(b => b.id === id);
        
        if (balloon) {
          const popup = {
            id: Math.random(),
            x: balloon.x,
            y: balloon.y,
            text: '+1'
          };
          
          setScorePopups(prev => [...prev, popup]);
          setTimeout(() => {
            setScorePopups(prev => prev.filter(p => p.id !== popup.id));
          }, 1000);
        }

        return newScore;
      });
    }
  }, [balloons]);

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      gameLoop.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            exitGame();
            updateHighScore(score);
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
  }, [gameActive, timeLeft, exitGame, score, updateHighScore]);

  useEffect(() => {
    if (gameActive) {
      balloonSpawner.current = setInterval(() => {
        const newBalloon = {
          id: Math.random(),
          x: Math.random() * 80 + 10,
          y: 100,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]
        };
        setBalloons(prev => [...prev, newBalloon]);
      }, BALLOON_SPAWN_INTERVAL);
    }

    return () => {
      if (balloonSpawner.current) {
        clearInterval(balloonSpawner.current);
      }
    };
  }, [gameActive]);

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
              <p className="score-text">New High Score! 🏆</p>
            )}
            <div className="button-container">
              <button 
                className="start-button" 
                onClick={startGame}
              >
                ▶ Play Again
              </button>
              <button 
                className="exit-button" 
                onClick={handleExitToHome}
              >
                ⬅ Exit to Home
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-area">
        {balloons.map(balloon => (
          <Balloon 
            key={balloon.id} 
            {...balloon} 
            onPop={popBalloon} 
          />
        ))}

        {scorePopups.map(popup => (
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
        onChatToggle={() => setChatOpen(prev => !prev)}
        chatOpen={chatOpen}
      />

      {chatOpen && <Chat onClose={() => setChatOpen(false)} />}
    </div>
  );
};

export default BalloonGame;
