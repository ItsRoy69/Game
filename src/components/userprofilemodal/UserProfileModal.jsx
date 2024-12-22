import React, { useState } from 'react';
import { X } from 'lucide-react';
import './userprofilemodal.css';

const UserProfileModal = ({ user, onClose }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === user.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? user.photos.length - 1 : prev - 1
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-photos">
          {user.photos && user.photos.length > 0 ? (
            <>
              <img 
                src={user.photos[currentPhotoIndex]} 
                alt={`${user.name}'s photo ${currentPhotoIndex + 1}`}
                className="main-photo"
              />
              {user.photos.length > 1 && (
                <div className="photo-navigation">
                  <button onClick={prevPhoto} className="nav-button">←</button>
                  <div className="photo-indicators">
                    {user.photos.map((_, index) => (
                      <span 
                        key={index} 
                        className={`indicator ${index === currentPhotoIndex ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                  <button onClick={nextPhoto} className="nav-button">→</button>
                </div>
              )}
            </>
          ) : (
            <div className="no-photo">No photos available</div>
          )}
        </div>

        <div className="modal-info">
          <div className="user-header">
            <h2>{user.name}</h2>
            <span className="user-age">{user.age} years old</span>
          </div>

          <div className="info-section">
            <h3>About Me</h3>
            <p>{user.about || "No description provided"}</p>
          </div>

          <div className="info-section">
            <h3>Gaming Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">High Score</span>
                <span className="stat-value">{user.gameScores?.highScore || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Games Played</span>
                <span className="stat-value">{user.gameScores?.gamesPlayed || 0}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>Favorite Games</h3>
            <div className="tags">
              {user.favoriteGames?.map((game, index) => (
                <span key={index} className="tag">{game}</span>
              )) || "No favorite games listed"}
            </div>
          </div>

          <div className="info-section">
            <h3>Preferred Cartoons</h3>
            <div className="tags">
              {user.preferredCartoons?.map((cartoon, index) => (
                <span key={index} className="tag">{cartoon}</span>
              )) || "No preferred cartoons listed"}
            </div>
          </div>

          <button className="challenge-button-userprofile">
            Challenge to Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;