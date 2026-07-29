import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../Context/gamecontext";

const API_URL = import.meta.env.VITE_API_URL;

type Turn = {
  id: string;
  created_at: string;
  room_id: string;
  prompt: string;
  content: string;
  author_name: string;
};

function Game() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { playerName, playerIndex } = useGame();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  async function loadTurns() {
    if (!roomId) return;
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}`);
      if (!res.ok) {
        setError("Couldn't load this room.");
        return;
      }
      const data = await res.json();
      setTurns(data);
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadTurns();
  }, [roomId]);

  // best-effort cleanup if the tab is closed or refreshed mid-game
  useEffect(() => {
    function handleUnload() {
      if (roomId && playerName) {
        const blob = new Blob(
          [JSON.stringify({ player_name: playerName })],
          { type: "application/json" }
        );
        navigator.sendBeacon(`${API_URL}/rooms/${roomId}/leave`, blob);
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [roomId, playerName]);

  async function handleLeaveClick() {
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
    navigate("/");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!prompt.trim()) {
      setError("Write something before submitting your turn.");
      return;
    }
    if (!roomId) {
      setError("Missing room id.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turn_prompt: prompt.trim(),
          author_name: playerName,
          player_index: playerIndex ?? 0,
          room_id: roomId,
        }),
      });

      if (!res.ok) {
        setError("Something went wrong submitting your turn.");
        return;
      }

      setPrompt("");
      await loadTurns();
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "560px", margin: "0 auto" }}>
        <h1>The Story So Far</h1>
        <button className="btn" onClick={handleLeaveClick}>Leave Room</button>
      </div>

      {fetching ? (
        <p>Loading...</p>
      ) : turns.length === 0 ? (
        <p>No turns yet. Be the first to write one!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "560px", margin: "0 auto", textAlign: "left" }}>
          {turns.map((turn) => (
            <div
              key={turn.id}
              style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem" }}
            >
              <p style={{ marginBottom: "0.5rem" }}>{turn.content}</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text)" }}>— {turn.author_name}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "560px", margin: "0 auto" }}>
          <textarea
            placeholder="Continue the story..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={500}
          />
          {error && <p style={{ color: "#e11d48" }}>{error}</p>}
          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Turn"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Game;