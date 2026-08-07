import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './database/connection.js';
import { initializeSocket } from './config/socket.js';
import { setupLobbySockets } from './sockets/lobby.handlers.js';
import { setupMatchSockets } from './sockets/match.handlers.js';

import authRoutes from './routes/auth.routes.js';
import matchmakingRoutes from './routes/matchmaking.routes.js';
import lobbiesRoutes from './routes/lobbies.routes.js';
import friendsRoutes from './routes/friends.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/matchmaking', matchmakingRoutes);
app.use('/lobbies', lobbiesRoutes);
app.use('/friends', friendsRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

initializeSocket(io);

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    setupLobbySockets(socket, io);
    setupMatchSockets(socket, io);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;

// Connect to DB then start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

