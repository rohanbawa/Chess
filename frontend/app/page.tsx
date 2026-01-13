"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "../socket"; 

export default function Home() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [generatedRoomId, setGeneratedRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle "Create Room"
  const handleCreateRoom = () => {
    if (!name) {
      alert("Please enter your name first!");
      return;
    }
    
    // 1. Generate random 4-digit number
    const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    
    // 2. Set it to state (optional visual feedback)
    setGeneratedRoomId(newRoomId);

    // 3. Save name and redirect
    sessionStorage.setItem("playerName", name);
    router.push(`/game/${newRoomId}`);
  };

  // Function to handle "Join Room"
  const handleJoinRoom = () => {
    if (!name) {
      alert("Please enter your name first!");
      return;
    }
    if (!joinRoomId || joinRoomId.length !== 4) {
      alert("Please enter a valid 4-digit Room ID");
      return;
    }

    setIsLoading(true);

    // 1. Connect manually to ask the server
    if (!socket.connected) socket.connect();

    // 2. Safety Timeout: If server is dead, don't hang forever
    const timeout = setTimeout(() => {
      setIsLoading(false);
      alert("Server did not respond. Is the backend running?");
    }, 3000);

    // 3. Emit the check event and wait for the callback response
    socket.emit("checkRoom", joinRoomId, (response: boolean) => {
      clearTimeout(timeout); // Cancel the timeout
      setIsLoading(false);   // Stop loading spinner
      
      if (response) {
        // SUCCESS: Room exists, proceed
        sessionStorage.setItem("playerName", name);
        router.push(`/game/${joinRoomId}`);
      } else {
        // FAILURE: Room does not exist
        alert("Room not found! Ensure the host has created the room and is on the game screen.");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-zinc-900 p-8 shadow-2xl border border-zinc-800">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-500 mb-2">Chess Online</h1>
          <p className="text-zinc-400">Enter your name to start playing</p>
        </div>

        {/* Name Input */}
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

        {/* Actions Grid */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* OPTION 1: CREATE ROOM */}
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

          {/* OPTION 2: JOIN ROOM */}
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
                onChange={(e) => setJoinRoomId(e.target.value.replace(/\D/g, ''))} // Only allow numbers
              />
              <button
                onClick={handleJoinRoom}
                disabled={isLoading}
                className={`whitespace-nowrap rounded-lg px-6 font-bold text-white transition ${
                  isLoading 
                    ? "bg-zinc-600 cursor-not-allowed" 
                    : "bg-green-600 hover:bg-green-700 active:scale-95"
                }`}
              >
                {isLoading ? "..." : "Join"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}