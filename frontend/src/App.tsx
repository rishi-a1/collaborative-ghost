import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Game from "./pages/Game.tsx";
import Lobby from "./pages/Lobby.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  );
}

export default App;