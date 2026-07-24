import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../Context/gamecontext";

function Create() {
  const navigate = useNavigate();
  const { setPlayerName, setJoinCode, setRoomId } = useGame();

  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }

    const parsedMax = parseInt(maxPlayers, 10);
    if (!parsedMax || parsedMax < 2) {
      setError("Max players must be at least 2.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PlayerName: name.trim(),
          MaxPlayers: parsedMax,
        }),
      });

      if (!res.ok) {
        setError("Something went wrong creating the room.");
        return;
      }

      const data = await res.json();

      setPlayerName(name.trim());
      setJoinCode(data.join_code);
      setRoomId(data.room_id);

      navigate(`/lobby/${data.room_id}`);
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home-container">
      <h1>Create a Room</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
          />
          <input
            type="number"
            placeholder="Max players"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            min={2}
            max={20}
          />
          {error && <p style={{ color: "#e11d48" }}>{error}</p>}
          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Create;