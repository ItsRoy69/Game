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
  const [gameEnded, setGameEnded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [localPlayerReady, setLocalPlayerReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const navigate = useNavigate();
  const rightGameRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { socket } = useChat();
  const gameTimer = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (!socket) {
      console.log('No socket connection');
      return;
    }

    socket.on('player_ready', (data) => {
      if (data.playerId === opponent.userId) {
        setOpponentReady(true);
      }
    });

    socket.on('game_start', () => {
      setGameStarted(true);
      startGameTimer();
    });

    return () => {
      socket.off('player_ready');
      socket.off('game_start');
      if (gameTimer.current) {
        clearTimeout(gameTimer.current);
      }
    };
  }, [socket, opponent]);

  useEffect(() => {
    if (!socket) return;

    socket.on('voice_offer', async ({ offer, from }) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
        
        peerConnection.ontrack = (event) => {
          remoteStreamRef.current = event.streams[0];
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };
        
        peerConnectionRef.current = peerConnection;
        
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('voice_candidate', {
              candidate: event.candidate,
              opponentId: opponent.userId
            });
          }
        };
        
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('voice_answer', {
          answer,
          opponentId: opponent.userId
        });
        
        setIsVoiceConnected(true);
      } catch (err) {
        console.error('Error handling voice offer:', err);
      }
    });

    socket.on('voice_answer', async ({ answer }) => {
      try {
        await peerConnectionRef.current?.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (err) {
        console.error('Error handling voice answer:', err);
      }
    });

    socket.on('voice_candidate', async ({ candidate }) => {
      try {
        await peerConnectionRef.current?.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        console.error('Error handling voice candidate:', err);
      }
    });

    return () => {
      socket.off('voice_offer');
      socket.off('voice_answer');
      socket.off('voice_candidate');
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      peerConnectionRef.current?.close();
    };
  }, [socket, opponent]);

  const startGameTimer = () => {
    gameTimer.current = setTimeout(() => {
      setGameEnded(true);
    }, 30000);
  };

  useEffect(() => {
    if (localPlayerReady && opponentReady) {
      setGameStarted(true);
      socket.emit('game_start', {
        opponentId: opponent.userId
      });
      startGameTimer();
    }
  }, [localPlayerReady, opponentReady, socket, opponent]);

  const setupVoiceCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };
      
      peerConnectionRef.current = peerConnection;
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('voice_candidate', {
            candidate: event.candidate,
            opponentId: opponent.userId
          });
        }
      };
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('voice_offer', {
        offer,
        opponentId: opponent.userId
      });
      
      setIsVoiceConnected(true);
    } catch (err) {
      console.error('Error setting up voice call:', err);
    }
  };

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

  const getWinnerMessage = () => {
    if (player1Score > player2Score) {
      return "You Win! 🎉";
    } else if (player2Score > player1Score) {
      return `${opponent.userName} Wins! 🏆`;
    } else {
      return "It's a Tie! 🤝";
    }
  };

  const handlePlayAgain = () => {
    setGameEnded(false);
    setGameStarted(false);
    setLocalPlayerReady(false);
    setOpponentReady(false);
    setPlayer1Score(0);
    setPlayer2Score(0);
    if (gameTimer.current) {
      clearTimeout(gameTimer.current);
    }
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
        <div className="voice-controls">
          {!isVoiceConnected ? (
            <button onClick={setupVoiceCall}>
              Start Voice Call
            </button>
          ) : (
            <>
              <button onClick={() => {
                const audioTracks = localStreamRef.current?.getAudioTracks();
                audioTracks?.forEach(track => track.enabled = !track.enabled);
                setIsMuted(!isMuted);
              }}>
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button onClick={() => {
                localStreamRef.current?.getTracks().forEach(track => track.stop());
                peerConnectionRef.current?.close();
                setIsVoiceConnected(false);
              }}>
                End Call
              </button>
            </>
          )}
        </div>
      </div>

      <audio ref={remoteAudioRef} autoPlay />

      {gameEnded && (
        <div className="winner-overlay">
          <div className="winner-content">
            <h2>{getWinnerMessage()}</h2>
            <div className="final-scores">
              <p>Your Score: {player1Score}</p>
              <p>{opponent.userName}'s Score: {player2Score}</p>
            </div>
            <div className="winner-buttons">
              <button className="play-again-button" onClick={handlePlayAgain}>
                Play Again
              </button>
              <button className="exit-button" onClick={handleBackClick}>
                Exit to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {!gameStarted && !gameEnded && (
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
              `${opponent.userName} is ready!` : 
              `Waiting for ${opponent.userName} to be ready...`}
          </div>
        </div>
      )}

      <div className="arena-content">
        <div className="game-section left">
          <div className="player-info">Your Game</div>
          <div className="game-wrapper">
            {gameStarted && !gameEnded && (
              <BalloonGame 
                key="player1-game"
                isArenaMode={true}
                onScoreUpdate={handlePlayer1Score}
                player={{
                  userId: socket.auth.userId
                }}
                gameActive={true}
                isOpponentView={false}
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
            {gameStarted && !gameEnded && (
              <BalloonGame 
                key="player2-game"
                isArenaMode={true}
                onScoreUpdate={handlePlayer2Score}
                player={{
                  userId: opponent.userId
                }}
                gameActive={true}
                isOpponentView={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitArena;