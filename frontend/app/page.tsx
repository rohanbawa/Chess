"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "../socket"; // 1. Import the socket instance

export default function Home() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [generatedRoomId, setGeneratedRoomId] = useState("");

  const handleCreateRoom = () => {
    if (!name) {
      alert("Please enter your name first!");
      return;
    }
    const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedRoomId(newRoomId);
    sessionStorage.setItem("playerName", name);
    router.push(`/game/${newRoomId}`);
  };

  // 2. Updated Join Logic
  const handleJoinRoom = () => {
    if (!name) {
      alert("Please enter your name first!");
      return;
    }
    if (!joinRoomId || joinRoomId.length !== 4) {
      alert("Please enter a valid 4-digit Room ID");
      return;
    }

    // Connect manually to ask the server
    if (!socket.connected) socket.connect();

    // Emit the check event and wait for the callback response
    socket.emit("checkRoom", joinRoomId, (response: boolean) => {
      if (response) {
        // SUCCESS: Room exists, proceed
        sessionStorage.setItem("playerName", name);
        router.push(`/game/${joinRoomId}`);
      } else {
        // FAILURE: Room does not exist
        alert("Room not found! Please check the ID or ask the host to create the room first.");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-zinc-900 p-8 shadow-2xl border border-zinc-800">
        
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-500 mb-2">Chess Online</h1>
          <p className="text-zinc-400">Enter your name to start playing</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Your Name</label>
          <input
            type="text"
            placeholder="e.g., Magnus Carlsen"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-zinc-700"></div>
          <span className="flex-shrink-0 px-4 text-zinc-500 text-sm">CHOOSE AN OPTION</span>
          <div className="flex-grow border-t border-zinc-700"></div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          
          {/* CREATE ROOM */}
          <div className="rounded-lg bg-zinc-800/50 p-4 border border-zinc-700 hover:border-blue-500/50 transition duration-300">
            <h2 className="text-lg font-semibold text-white mb-2">Create New Room</h2>
            <p className="text-sm text-zinc-400 mb-4">Start a new game and invite a friend.</p>
            <button
              onClick={handleCreateRoom}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 active:scale-95 transition"
            >
              Generate Room & Play
            </button>
          </div>

          {/* JOIN ROOM */}
          <div className="rounded-lg bg-zinc-800/50 p-4 border border-zinc-700 hover:border-green-500/50 transition duration-300">
            <h2 className="text-lg font-semibold text-white mb-2">Join Existing Room</h2>
            <p className="text-sm text-zinc-400 mb-4">Enter the 4-digit code from your friend.</p>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 p-3 text-center text-lg tracking-widest text-white focus:border-green-500 focus:outline-none"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.replace(/\D/g, ''))}
              />
              <button
                onClick={handleJoinRoom}
                className="whitespace-nowrap rounded-lg bg-green-600 px-6 font-bold text-white hover:bg-green-700 active:scale-95 transition"
              >
                Join
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}