import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors()); // allows the server to make API calls to a server on a different domain/port.

// Create HTTP server wrapping Express
const httpServer = createServer(app);

// Attach Socket.IO to HTTP server with CORS enabled for client
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // React app URL
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Basic HTTP test route
app.get('/', (req, res) => {
    res.send('BlackHoleIO Game Server Running');
});

// Socket.IO event handler
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Game server listening on http://localhost:${PORT}`);
});