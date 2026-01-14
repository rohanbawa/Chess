"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Chess } from "chess.js";
import dynamic from 'next/dynamic';
import { socket } from "../../../socket";

const Chessboard = dynamic(() => import("react-chessboard").then((mod) => mod.Chessboard), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-800 animate-pulse rounded-lg"></div>
});

export default function GamePage() {
  const params = useParams();
  const roomId = params.room as string;

  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [color, setColor] = useState<'w' | 'b' | null>(null);

  useEffect(() => {
    // Define listeners
    const onBoardState = (fenString: string) => {
      const newGame = new Chess(fenString);
      setGame(newGame);
      setFen(fenString);
    };

    const onPlayerColor = (assignedColor: 'w' | 'b') => {
      console.log("My color is:", assignedColor);
      setColor(assignedColor);
    };

    const onConnect = () => {
      console.log("Connected/Reconnected! Joining room check...");
      socket.emit("joinRoom", roomId);
    };

    // Attach listeners
    socket.on("boardState", onBoardState);
    socket.on("playerColor", onPlayerColor);
    socket.on("connect", onConnect);

    // Connect if disconnected
    if (!socket.connected) {
      socket.connect();
    } else {
      // If already connected, manual join
      onConnect();
    }

    // Cleanup listeners on unmount
    return () => {
      socket.off("boardState", onBoardState);
      socket.off("playerColor", onPlayerColor);
      socket.off("connect", onConnect);
      socket.disconnect();
    };
  }, [roomId]);

  const onDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string | null }) => {
    // Prevent moving if it's not your turn or not your color
    if (game.turn() !== color || !targetSquare) return false;

    try {
      const tempGame = new Chess(game.fen());
      const move = tempGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) return false;

      setGame(tempGame);
      setFen(tempGame.fen());

      socket.emit("move", {
        roomId,
        move: { from: sourceSquare, to: targetSquare, promotion: "q" },
      });

      return true;
    } catch (error) {
      return false;
    }
  };

  // Show loading screen until color is assigned
  if (!color) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <div className="text-xl font-mono animate-pulse">Connecting to server...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {roomId}</h1>

      <div className="mb-4 text-xl">
        You are playing as: <span className={`font-bold uppercase ${color === 'w' ? "text-green-400" : "text-red-400"}`}>
          {color === 'w' ? "White" : "Black"}
        </span>
      </div>

      <div className="w-full max-w-[500px] aspect-square border-4 border-neutral-700 rounded-lg overflow-hidden shadow-2xl">
        <Chessboard
          options={{
            position: fen,
            onPieceDrop: onDrop,
            boardOrientation: color === 'w' ? 'white' : 'black',
          }}
        />
      </div>

      {/* Basic Game Over Status */}
      {game.isGameOver() && (
        <div className="mt-6 p-4 bg-red-600/20 border border-red-500 rounded text-center">
          <h2 className="text-xl font-bold text-red-200">GAME OVER</h2>
          <p className="text-red-100">
            {game.isCheckmate() ? "Checkmate!" : "Draw"}
          </p>
        </div>
      )}
    </div>
  );
}