// routes/index.jsx
import { Routes, Route } from "react-router-dom";
import { AuthProtectedRoute, ProfileProtectedRoute } from "./ProtectedRoutes";
import Home from "../pages/home/Home";
import ProfileSettings from "../pages/profilesettings/ProfileSettings";
import BalloonGame from "../pages/balloongame/BalloonGame";
import GameChallenges from "../pages/gamechallenges/GameChallenges";
import SplitArena from "../pages/splitarena/SplitArena";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    
    <Route
      path="/profilesettings"
      element={
        <AuthProtectedRoute>
          <ProfileSettings />
        </AuthProtectedRoute>
      }
    />
    
    <Route
      path="/balloongame"
      element={
        <AuthProtectedRoute>
          <BalloonGame />
        </AuthProtectedRoute>
      }
    />
    
    <Route
      path="/challenges/:gameId"
      element={
        <ProfileProtectedRoute>
          <GameChallenges />
        </ProfileProtectedRoute>
      }
    />
    
    <Route
      path="/arena/:gameId"
      element={
        <ProfileProtectedRoute>
          <SplitArena />
        </ProfileProtectedRoute>
      }
    />
  </Routes>
);

export default AppRoutes;


