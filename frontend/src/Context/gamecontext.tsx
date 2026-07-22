import { createContext, useContext, useState, ReactNode } from "react";

type GameState = {
  playerName: string;
  roomId: string | null;
  joinCode: string | null;
  setPlayerName: (name: string) => void;
  setRoomId: (id: string) => void;
  setJoinCode: (code: string) => void;
};

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);

  return (
    <GameContext.Provider value={{ playerName, roomId, joinCode, setPlayerName, setRoomId, setJoinCode }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}