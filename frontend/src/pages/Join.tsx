import { useState } from "react"; 
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../Context/gamecontext";

function Join() {
  const navigate = useNavigate();
  const { setPlayerName, setJoinCode, setRoomId } = useGame();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim()) {
      setError("Enter your name and a join code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_name: name.trim(),
          join_code: code.trim(),
        }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError("Room not found. Check the join code.");
        } else {
          setError("Something went wrong joining the room.");
        }
        return;
      }

      const data = await res.json();

      if (data.error) {
        setError(data.error === "room full" ? "That room is full." : data.error);
        return;
      }

      setPlayerName(name.trim());
      setJoinCode(code.trim().toUpperCase());
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
      <h1>Join a Room</h1>
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
            type="text"
            placeholder="Join code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={10}
          />
          {error && <p style={{ color: "#e11d48" }}>{error}</p>}
          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Join;