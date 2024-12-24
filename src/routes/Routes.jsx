import { Routes, Route } from "react-router-dom";
import Home from "../pages/home/Home";
import BalloonGame from "../pages/balloongame/BalloonGame";
import ProfileSettings from "../pages/profilesettings/ProfileSettings";
import GameChallenges from "../pages/gamechallenges/GameChallenges";
import SplitArena from "../pages/splitarena/SplitArena";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/balloongame" element={<BalloonGame />} />
      <Route path="/profilesettings" element={<ProfileSettings />} />
      <Route path="/challenges/:gameId" element={<GameChallenges />} />
      <Route path="/arena" element={<SplitArena />} />
    </Routes>
  );
}

export default AppRoutes;
