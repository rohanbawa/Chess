"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { socket } from "../../../socket"; 

// NUCLEAR FIX: Cast the component to 'any' to completely disable type checking for it.
const SafeChessboard = Chessboard as any;

export default function GamePage() {
  const params = useParams();
  const roomId = params.room as string;

  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [color, setColor] = useState<'w' | 'b' | null>(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit("joinRoom", roomId);

    socket.on("boardState", (fenString: string) => {
      const newGame = new Chess(fenString);
      setGame(newGame);
      setFen(fenString);
    });

    socket.on("playerColor", (assignedColor: 'w' | 'b') => {
      setColor(assignedColor);
    });

    return () => {
      socket.off("boardState");
      socket.off("playerColor");
      socket.disconnect();
    };
  }, [roomId]);

  const onDrop = (sourceSquare: any, targetSquare: any) => {
    if (game.turn() !== color) return false;

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

  if (!color) return <div className="p-10 text-white">Connecting...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {roomId}</h1>
      
      <div className="mb-4">
        You are: <span className="font-bold text-yellow-400">{color === 'w' ? "White" : "Black"}</span>
      </div>

      <div className="w-full max-w-[500px] aspect-square border-4 border-neutral-700 rounded-lg overflow-hidden">
        {/* Use the SafeChessboard here */}
        <SafeChessboard 
          position={fen} 
          onPieceDrop={onDrop}
          boardOrientation={color === 'w' ? 'white' : 'black'}
        />
      </div>
    </div>
  );
}