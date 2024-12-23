import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import BalloonGame from '../balloongame/BalloonGame';
import './splitarena.css';

const SplitArena = () => {
  const location = useLocation();
  const opponent = location.state?.opponent;
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [localPlayerReady, setLocalPlayerReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const navigate = useNavigate();
  const rightGameRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { socket } = useChat();

  useEffect(() => {
    if (!socket) return;

    socket.on('player_ready', (data) => {
      if (data.playerId === opponent.userId) {
        setOpponentReady(true);
      }
    });

    socket.on('game_start', () => {
      setGameStarted(true);
    });

    return () => {
      socket.off('player_ready');
      socket.off('game_start');
    };
  }, [socket, opponent]);

  useEffect(() => {
    if (localPlayerReady && opponentReady) {
      setTimeout(() => {
        setGameStarted(true);
        socket.emit('game_start', {
          opponentId: opponent.userId
        });
      }, 1000);
    }
  }, [localPlayerReady, opponentReady, socket, opponent]);

  const handleDragStart = (e) => {
    const rightGame = rightGameRef.current;
    if (!rightGame) return;
  
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    const startY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = rightGame.getBoundingClientRect();
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;
  
    const handleDrag = (e) => {
      const currentX = e.touches ? e.touches[0].clientX : e.clientX;
      const currentY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let newX = currentX - offsetX;
      let newY = currentY - offsetY;
      
      newX = Math.max(0, Math.min(newX, windowWidth - rect.width));
      newY = Math.max(0, Math.min(newY, windowHeight - rect.height));
      
      setPosition({
        x: newX,
        y: newY
      });
    };
  
    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('touchend', handleDragEnd);
    };
  
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDrag);
    document.addEventListener('touchend', handleDragEnd);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const handleStartGame = () => {
    setLocalPlayerReady(true);
    socket.emit('player_ready', {
      playerId: socket.auth.userId,
      opponentId: opponent.userId
    });
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handlePlayer1Score = (score) => {
    setPlayer1Score(score);
  };

  const handlePlayer2Score = (score) => {
    setPlayer2Score(score);
  };

  if (!opponent) {
    return <div>Invalid arena access</div>;
  }

  return (
    <div className="arena-page">
      <div className="arena-header">
        <button className="back-button" onClick={handleBackClick}>
          ⬅ Back
        </button>
        <h1 className="arena-title">Battle Arena</h1>
        <div className="score-display">
          <span>You: {player1Score}</span>
          <span className="vs">VS</span>
          <span>{opponent.userName}: {player2Score}</span>
        </div>
      </div>

      {!gameStarted && (
        <div className="ready-status">
          <button 
            className={`start-button ${localPlayerReady ? 'ready' : ''}`} 
            onClick={handleStartGame}
            disabled={localPlayerReady}
          >
            {localPlayerReady ? "Ready!" : "Click When Ready"}
          </button>
          <div className="opponent-status">
            {opponentReady ? 
              `Opponent ${opponent.userName} is ready!` : 
              `Waiting for ${opponent.userName} to be ready!`}
          </div>
        </div>
      )}

      <div className="arena-content">
        <div className="game-section left">
          <div className="player-info">Your Game</div>
          <div className="game-wrapper">
            {gameStarted && (
              <BalloonGame 
              isArenaMode={true}
              onScoreUpdate={handlePlayer1Score}
              player={{
                userId: socket.auth.userId
              }}
            />
            )}
          </div>
        </div>
        
        <div className="separator"></div>

        <div 
          ref={rightGameRef}
          className={`game-section right ${isMinimized ? 'minimized' : ''}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <button className="expand-button" onClick={toggleMinimize}>
            {isMinimized ? '↗' : '↙'}
          </button>
          <div className="player-info">{opponent.userName}'s Game</div>
          <div className="game-wrapper">
            {gameStarted && (
              <BalloonGame 
              isArenaMode={true}
              onScoreUpdate={handlePlayer2Score}
              player={{
                userId: opponent.userId
              }}
            />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitArena;