import { Routes, Route } from "react-router-dom";
import Home from "../pages/home/Home";
import BalloonGame from "../pages/balloongame/BalloonGame";
import ProfileSettings from "../pages/profilesettings/ProfileSettings";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/balloongame" element={<BalloonGame />} />
      <Route path="/profilesettings" element={<ProfileSettings />} />
    </Routes>
  );
}

export default AppRoutes;
