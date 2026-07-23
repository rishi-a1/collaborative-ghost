import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Game from "./pages/Game.tsx";
import Lobby from "./pages/Lobby.tsx";
import Join from "./pages/Join.tsx";
import Create from "./pages/Create.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lobby/:roomId" element={<Lobby />} />
      <Route path="/game/:roomId" element={<Game />} />
      <Route path="/join" element={<Join />} />
      <Route path="/create" element={<Create />} />
    </Routes>
  );
}

export default App;