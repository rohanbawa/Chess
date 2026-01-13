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
    origin: "*", // Allow all origins for easier development
    methods: ["GET", "POST"]
  }
});

// Store games in memory
let games = {}; 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. VALIDATION LISTENER (This was likely missing!)
  socket.on('checkRoom', (roomId, callback) => {
    const roomExists = games[roomId] !== undefined;
    console.log(`Check Room Request: ${roomId} -> Exists? ${roomExists}`);
    callback(roomExists);
  });

  // 2. JOIN ROOM LISTENER
  socket.on('joinRoom', (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    
    // Logic: If room is empty (or doesn't exist), user is White.
    const clients = room ? room.size : 0;
    const color = clients === 0 ? 'w' : 'b'; 

    if (clients >= 2) {
      socket.emit('roomFull');
      return;
    }

    socket.join(roomId);

    // Initialize game if it doesn't exist
    if (!games[roomId]) {
      games[roomId] = new Chess();
      console.log(`New Game Created: ${roomId}`);
    }

    const game = games[roomId];
    
    socket.emit('playerColor', color);
    socket.emit('boardState', game.fen());
    
    console.log(`User joined ${roomId} as ${color === 'w' ? "White" : "Black"}`);
  });

  // 3. MOVE LISTENER
  socket.on('move', ({ roomId, move }) => {
    const game = games[roomId];

    if (game) {
      try {
        const result = game.move(move); 
        if (result) {
          io.to(roomId).emit('boardState', game.fen());
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