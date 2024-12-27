import React, { useState, useEffect } from 'react';
import './gamecustomization.css';

const defaultSettings = {
  gameDuration: 30,
  balloonSpeed: 1000,
  maxBalloons: 10
};

const GameCustomization = ({ socket, opponent, onSettingsConfirmed }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [localReady, setLocalReady] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [receivedSettings, setReceivedSettings] = useState(null);
  const [showMismatch, setShowMismatch] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('opponent_settings', (data) => {
      if (!localReady) {
        setShowConfirmPopup(true);
        setReceivedSettings(data.settings);
      }
    });

    return () => {
      socket.off('opponent_settings');
    };
  }, [socket, localReady]);

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: Number(value)
    }));
    setLocalReady(false);
    setShowMismatch(false);
  };

  const handleConfirm = () => {
    setLocalReady(true);
    socket.emit('game_settings', {
      settings,
      opponentId: opponent.userId
    });
  };

  const handlePopupConfirm = () => {
    setSettings(receivedSettings);
    setShowConfirmPopup(false);
    onSettingsConfirmed(receivedSettings);
    setLocalReady(true);
  };

  const handlePopupDecline = () => {
    setShowConfirmPopup(false);
    setShowMismatch(true);
  };

  return (
    <div className="game-customization">
      <h3 className="settings-title">Game Settings</h3>
      
      <div className="setting-group">
        <label>
          Game Duration (seconds):
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={settings.gameDuration}
            onChange={(e) => handleSettingChange('gameDuration', e.target.value)}
          />
          <span>{settings.gameDuration}s</span>
        </label>
      </div>

      <div className="setting-group">
        <label>
          Balloon Speed (ms):
          <input
            type="range"
            min="500"
            max="2000"
            step="100"
            value={settings.balloonSpeed}
            onChange={(e) => handleSettingChange('balloonSpeed', e.target.value)}
          />
          <span>{settings.balloonSpeed}ms</span>
        </label>
      </div>

      <div className="setting-group">
        <label>
          Max Balloons:
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={settings.maxBalloons}
            onChange={(e) => handleSettingChange('maxBalloons', e.target.value)}
          />
          <span>{settings.maxBalloons}</span>
        </label>
      </div>

      {showMismatch && (
        <div className="settings-mismatch">
          Settings don't match with opponent's choices. Please adjust and try again.
        </div>
      )}

      <div className="settings-status">
        <div>You: {localReady ? '✅ Ready' : '⏳ Not Ready'}</div>
        <div>{opponent.userName}: {receivedSettings ? '✅ Ready' : '⏳ Not Ready'}</div>
      </div>

      <button 
        onClick={handleConfirm}
        disabled={localReady}
        className={`settings-confirm ${localReady ? 'disabled' : ''}`}
      >
        {localReady ? 'Waiting for Opponent' : 'Confirm Settings'}
      </button>

      {showConfirmPopup && (
        <div className="settings-popup-overlay">
          <div className="settings-popup">
            <h4>{opponent.userName} has shared game settings:</h4>
            <div className="settings-details">
              <p>Game Duration: {receivedSettings.gameDuration} seconds</p>
              <p>Balloon Speed: {receivedSettings.balloonSpeed}ms</p>
              <p>Max Balloons: {receivedSettings.maxBalloons}</p>
            </div>
            <div className="popup-buttons">
              <button onClick={handlePopupConfirm}>Accept</button>
              <button onClick={handlePopupDecline}>Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCustomization;