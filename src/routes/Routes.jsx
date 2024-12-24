import { Routes, Route } from "react-router-dom";
import { AuthProtectedRoute, ProfileProtectedRoute } from "./ProtectedRoutes";
import Home from "../pages/home/Home";
import ProfileSettings from "../pages/profilesettings/ProfileSettings";
import BalloonGame from "../pages/balloongame/BalloonGame";
import Challenges from "../pages/gamechallenges/GameChallenges";
import Arena from "../pages/splitarena/SplitArena";

const AppRoutes = () => {
  return (
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
        path="/challenges/*"
        element={
          <ProfileProtectedRoute>
            <Challenges />
          </ProfileProtectedRoute>
        }
      />

      <Route
        path="/arena/*"
        element={
          <ProfileProtectedRoute>
            <Arena />
          </ProfileProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
