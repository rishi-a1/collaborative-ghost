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

type RoomState = {
  turns: Turn[];
  current_turn: number;
  players: string[];
  max_players: number;
};

function Game() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { playerName, playerIndex, joinCode } = useGame();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [players, setPlayers] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const isMyTurn = playerIndex !== null && playerIndex === currentTurn;
  const currentPlayerName = players[currentTurn] ?? null;

  async function loadTurns() {
    if (!roomId) return;
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}`);
      if (!res.ok) {
        setError("Couldn't load this room.");
        return;
      }
      const data: RoomState = await res.json();
      setTurns(data.turns);
      setCurrentTurn(data.current_turn);
      setPlayers(data.players);
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadTurns();
  }, [roomId]);

  // poll for updates so players see new turns (and whose turn it is)
  // without needing to manually refresh
  useEffect(() => {
    const interval = setInterval(loadTurns, 4000);
    return () => clearInterval(interval);
  }, [roomId]);

  // best-effort cleanup if the tab is closed or refreshed mid-game
  useEffect(() => {
    function handleUnload() {
      if (roomId && playerName) {
        // text/plain (not application/json) keeps this a "simple" CORS
        // request that doesn't need a preflight — preflighted requests
        // often get dropped when the tab is already closing. FastAPI
        // parses the body as JSON regardless of the Content-Type header.
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

    if (!isMyTurn) {
      setError("It's not your turn yet.");
      return;
    }
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
        if (res.status === 403) {
          setError("It's not your turn yet.");
        } else {
          setError("Something went wrong submitting your turn.");
        }
        await loadTurns();
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
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>The Story So Far</h1>
          {joinCode && (
            <p style={{ fontSize: "0.9rem", color: "var(--text)" }}>Room code: {joinCode}</p>
          )}
        </div>
        <button className="btn" onClick={handleLeaveClick}>Leave Room</button>
      </div>

      {!fetching && players.length > 0 && (
        <p style={{ maxWidth: "560px", margin: "1rem auto 0" }}>
          {isMyTurn ? "It's your turn!" : currentPlayerName ? `Waiting on ${currentPlayerName}'s turn...` : ""}
        </p>
      )}

      {fetching ? (
        <p>Loading...</p>
      ) : turns.length === 0 ? (
        <p>No turns yet. Be the first to write one!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "560px", margin: "1rem auto 0", textAlign: "left" }}>
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
            placeholder={isMyTurn ? "Continue the story..." : "Waiting for your turn..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={500}
            disabled={!isMyTurn || loading}
          />
          {error && <p style={{ color: "#e11d48" }}>{error}</p>}
          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading || !isMyTurn}>
              {loading ? "Submitting..." : isMyTurn ? "Submit Turn" : "Not your turn"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Game;