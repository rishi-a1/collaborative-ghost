import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type GameState = {
  playerName: string;
  roomId: string | null;
  joinCode: string | null;
  playerIndex: number | null;
  setPlayerName: (name: string) => void;
  setRoomId: (id: string) => void;
  setJoinCode: (code: string) => void;
  setPlayerIndex: (index: number) => void;
};

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);

  return (
    <GameContext.Provider
      value={{
        playerName,
        roomId,
        joinCode,
        playerIndex,
        setPlayerName,
        setRoomId,
        setJoinCode,
        setPlayerIndex,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}