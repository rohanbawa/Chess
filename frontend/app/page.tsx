"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [room, setRoom] = useState("");
  const router = useRouter();

  const joinRoom = () => {
    if (room.trim()) router.push(`/game/${room}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4">
      <h1 className="text-4xl font-bold">Chess Online</h1>
      <input
        type="text"
        placeholder="Enter Room Name (e.g., room1)"
        className="p-2 rounded text-black"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button 
        onClick={joinRoom}
        className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 font-bold"
      >
        Join Game
      </button>
    </div>
  );
}