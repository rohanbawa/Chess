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
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ROBUST STATE MANAGEMENT
// Structure:
// games[roomId] = {
//   chess: ChessInstance,
//   players: [ { id: "socketId", color: "w" } ]
// }
let games = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Validator
  socket.on('checkRoom', (roomId, callback) => {
    const roomExists = games[roomId] !== undefined;
    callback(roomExists);
  });

  // 2. Join Room (Fixed Logic)
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);

    // Initialize game if needed
    if (!games[roomId]) {
      games[roomId] = {
        chess: new Chess(),
        players: []
      };
    }

    const game = games[roomId];

    // Check if player is already in the game (re-join handling)
    const existingPlayer = game.players.find(p => p.id === socket.id);

    if (existingPlayer) {
      // User is already here, just send them their info
      socket.emit('playerColor', existingPlayer.color);
      socket.emit('boardState', game.chess.fen());
      return;
    }

    // Assign Color based on available slots
    let assignedColor = null;

    const isWhiteTaken = game.players.some(p => p.color === 'w');
    const isBlackTaken = game.players.some(p => p.color === 'b');

    if (!isWhiteTaken) {
      assignedColor = 'w';
    } else if (!isBlackTaken) {
      assignedColor = 'b';
    } else {
      socket.emit('roomFull'); // 3rd player rejected
      return;
    }

    // Add player to the list
    game.players.push({ id: socket.id, color: assignedColor });

    // Send state
    socket.emit('playerColor', assignedColor);
    socket.emit('boardState', game.chess.fen());

    console.log(`Player joined ${roomId} as ${assignedColor}`);
  });

  // 3. Move Logic
  socket.on('move', ({ roomId, move }) => {
    const game = games[roomId];

    if (game && game.chess) {
      try {
        const result = game.chess.move(move);
        if (result) {
          io.to(roomId).emit('boardState', game.chess.fen());
        }
      } catch (e) {
        console.log('Invalid move:', move);
      }
    }
  });

  // 4. Cleanup on Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Optional: Remove player from game so they can rejoin or someone else can take the spot
    // Looping through all rooms to find where this socket was
    for (const roomId in games) {
      const game = games[roomId];
      const playerIndex = game.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        // Remove the player
        game.players.splice(playerIndex, 1);

        // If room is empty, delete the game to save memory
        if (game.players.length === 0) {
          delete games[roomId];
        }
        break;
      }
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});