import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useGame } from "../Context/gamecontext";

const API_URL = import.meta.env.VITE_API_URL;

type RoomState = {
  current_turn: number;
  players: string[];
  max_players: number;
};

function Lobby() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { playerName, joinCode, setPlayerIndex } = useGame();

  const [players, setPlayers] = useState<string[]>([]);
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null);
  const [currentTurn, setCurrentTurn] = useState(0);

  async function loadRoom() {
    if (!roomId) return;
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}`);
      if (!res.ok) return;
      const data: RoomState = await res.json();
      setPlayers(data.players);
      setMaxPlayers(data.max_players);
      setCurrentTurn(data.current_turn);

      const liveIndex = data.players.indexOf(playerName);
      if (liveIndex !== -1) {
        setPlayerIndex(liveIndex);
      }
    } catch (err) {
      // best effort — lobby just won't update this cycle
    }
  }

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  // poll so everyone sees new players join (and who'll go first) live
  useEffect(() => {
    const interval = setInterval(loadRoom, 3000);
    return () => clearInterval(interval);
  }, [roomId, playerName]);

  async function leaveRoom() {
    if (roomId && playerName) {
      try {
        await fetch(`${API_URL}/rooms/${roomId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player_name: playerName }),
        });
      } catch (err) {
        // best effort — still navigate away even if the request fails
      }
    }
  }

  // best-effort cleanup if the tab is closed or refreshed while in the lobby
  useEffect(() => {
    function handleUnload() {
      if (roomId && playerName) {
        // text/plain (not application/json) keeps this a "simple" CORS request
        // that doesn't need a preflight — preflighted requests often get
        // dropped when the tab is already closing. FastAPI parses the body
        // as JSON regardless of the Content-Type header.
        const blob = new Blob(
          [JSON.stringify({ player_name: playerName })],
          { type: "text/plain" }
        );
        navigator.sendBeacon(`${API_URL}/rooms/${roomId}/leave`, blob);
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [roomId, playerName]);

  async function handleLeaveClick() {
    await leaveRoom();
    navigate("/");
  }

  return (
    <div className="home-container">
      <h1>Lobby</h1>
      {joinCode && <p>Join code: {joinCode}</p>}
      <p>You're in as {playerName || "..."}</p>

      <div style={{ maxWidth: "320px", margin: "1.5rem auto 0", textAlign: "left" }}>
        <p style={{ marginBottom: "0.5rem" }}>
          Players {maxPlayers !== null ? `(${players.length}/${maxPlayers})` : ""}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {players.map((p, i) => (
            <div
              key={`${p}-${i}`}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: i === currentTurn ? "var(--accent-bg)" : "transparent",
                borderColor: i === currentTurn ? "var(--accent-border)" : "var(--border)",
                fontWeight: i === currentTurn ? 600 : 400,
              }}
            >
              {p} {i === currentTurn && "— goes first"}
            </div>
          ))}
        </div>
      </div>

      <div className="button-group" style={{ marginTop: "2rem" }}>
        {roomId && (
          <Link to={`/game/${roomId}`} className="btn btn-primary">
            Start Game
          </Link>
        )}
        <button className="btn" onClick={handleLeaveClick}>
          Leave Room
        </button>
      </div>
    </div>
  );
}

export default Lobby;