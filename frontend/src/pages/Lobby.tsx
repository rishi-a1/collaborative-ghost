import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useGame } from "../Context/gamecontext";

function Lobby() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { playerName, joinCode } = useGame();

  async function leaveRoom() {
    if (roomId && playerName) {
      try {
        await fetch(`http://localhost:8000/rooms/${roomId}/leave`, {
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
        const blob = new Blob(
          [JSON.stringify({ player_name: playerName })],
          { type: "application/json" }
        );
        navigator.sendBeacon(`http://localhost:8000/rooms/${roomId}/leave`, blob);
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