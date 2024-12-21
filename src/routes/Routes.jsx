// src/routes/Routes.jsx
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/home/Home';
import BalloonGame from '../pages/balloongame/BalloonGame';


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/balloon-game" element={<BalloonGame />} />
      {/* <Route path="/about" element={<About />} /> */}
    </Routes>
  );
}

export default AppRoutes;