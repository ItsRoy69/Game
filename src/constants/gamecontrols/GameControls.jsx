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
        <div className="minecraft-score-display">
          <span className="stats-icon">💎</span>
          <span className="minecraft-score-value">{score}</span>
        </div>

        <button
          onClick={gameActive ? onExitGame : onStartGame}
          className={`minecraft-button ${
            gameActive ? "exit-button" : "start-button"
          }`}
        >
          {gameActive ? "⬛ Stop Game" : "▶ Start Game"}
        </button>

        <button
          className={`minecraft-button chat-button ${chatOpen ? "active" : ""}`}
          onClick={onChatToggle}
        >
          <MessageCircle className="chat-icon" />
        </button>
      </div>
    </div>
  );
};

export default GameControls;
