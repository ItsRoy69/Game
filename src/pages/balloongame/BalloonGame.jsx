import React, { useState, useEffect, useCallback } from 'react';
import Balloon from '../../components/Balloon/Balloon';
import './balloongame.css';

const BALLOON_COLORS = [
  'red',
  'blue',
  'yellow',
  'green',
  'black',
  'pink'
];

function BalloonGame() {
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [scorePopups, setScorePopups] = useState([]);

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(30);
    setBalloons([]);
    setScorePopups([]);
  };

  useEffect(() => {
    let intervalId;
    if (gameActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setGameActive(false);
    }
    return () => clearInterval(intervalId);
  }, [gameActive, timeLeft]);

  useEffect(() => {
    let balloonInterval;
    if (gameActive) {
      balloonInterval = setInterval(() => {
        const newBalloon = {
          id: Math.random(),
          x: Math.random() * 80 + 10,
          y: 100,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
        };
        setBalloons((prev) => [...prev, newBalloon]);
      }, 1000);
    }
    return () => clearInterval(balloonInterval);
  }, [gameActive]);

  const popBalloon = useCallback((id, shouldScore) => {
    setBalloons((prev) => prev.filter((balloon) => balloon.id !== id));
    
    if (shouldScore) {
      setScore((prev) => prev + 1);
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
    }
  }, [balloons]);

  return (
    <div className="balloon-game">
      <div className="game-info">
        <h1 className="game-title">Balloon Popper</h1>
        <div className="stats">
          <p>Score: {score}</p>
          <p>Time: {timeLeft}s</p>
        </div>
        {!gameActive && (
          <button className="start-button" onClick={startGame}>
            {timeLeft === 30 ? 'Start Game' : 'Play Again'}
          </button>
        )}
      </div>
      <div className="game-area">
        {balloons.map((balloon) => (
          <Balloon
            key={balloon.id}
            {...balloon}
            onPop={popBalloon}
          />
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
    </div>
  );
}

export default BalloonGame;