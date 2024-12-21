import React from "react";
import { MessageCircle } from "lucide-react";
import "./gamecontrols.css";

const GameControls = ({
  score,
  gameActive,
  onStartGame,
  onExitGame,
  onChatToggle,
  chatOpen,
}) => {
  return (
    <div className="game-controls">
      <div className="controls-container">
        <div className="score-display">
          <div className="score-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <span className="score-value">{score}</span>
        </div>

        <button
          onClick={gameActive ? onExitGame : onStartGame}
          className={`game-control-button ${gameActive ? "stop" : "start"}`}
        >
          {gameActive ? "Stop Game" : "Start Game"}
        </button>

        <button className="chat-button" onClick={onChatToggle}>
          <MessageCircle />
        </button>
      </div>
    </div>
  );
};

export default GameControls;
