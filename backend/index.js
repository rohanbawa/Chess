const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow connection from Next.js
    methods: ["GET", "POST"]
  }
});

// Store games in memory: { roomId: ChessInstance }
let games = {}; 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);

    // Limit room to 2 players
    if (room && room.size >= 2) {
      socket.emit('roomFull');
      return;
    }

    socket.join(roomId);

    // Initialize game if it doesn't exist
    if (!games[roomId]) {
      games[roomId] = new Chess();
    }

    const game = games[roomId];
    
    // Assign color: First to join is White, second is Black
    const playersInRoom = room ? room.size : 0; // After join update
    const color = playersInRoom === 0 ? 'w' : 'b'; 

    socket.emit('playerColor', color);
    socket.emit('boardState', game.fen());
    
    console.log(`User joined ${roomId} as ${color}`);
  });

  socket.on('move', ({ roomId, move }) => {
    const game = games[roomId];

    if (game) {
      try {
        const result = game.move(move); // Update server state
        if (result) {
          io.to(roomId).emit('boardState', game.fen()); // Broadcast new board
        }
      } catch (e) {
        console.log('Invalid move:', move);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});