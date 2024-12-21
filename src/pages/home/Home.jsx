// src/pages/Home/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './home.css';

function Home() {
  return (
    <div className="home">
      <h1>Welcome to Game Center</h1>
      <div className="game-links">
        <Link to="/balloon-game" className="game-card">
          <h2>Balloon Popper</h2>
          <p>Pop as many balloons as you can in 30 seconds!</p>
        </Link>
        {/* Add more game cards here */}
      </div>
    </div>
  );
}

export default Home;