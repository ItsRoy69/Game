import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BalloonGame from '../balloongame/BalloonGame';
import './splitarena.css';

const SplitArena = () => {
  const location = useLocation();
  console.log('Location State:', location.state);
  const opponent = location.state?.opponent;
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/');
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

      <div className="arena-content">
        <div className="game-section left">
          <div className="player-info">Your Game</div>
          <div className="game-wrapper">
            <BalloonGame 
              isArenaMode={true}
              onScoreUpdate={handlePlayer1Score}
            />
          </div>
        </div>
        
        <div className="separator"></div>

        <div className="game-section right">
          <div className="player-info">{opponent.userName}'s Game</div>
          <div className="game-wrapper">
            <BalloonGame 
              isArenaMode={true}
              onScoreUpdate={handlePlayer2Score}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitArena;