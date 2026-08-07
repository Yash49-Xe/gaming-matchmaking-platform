import { lobbies, matches } from '../utils/mockData.js';
import { v4 as uuidv4 } from 'uuid';

export const setupLobbySockets = (socket, io) => {
    socket.on('join_lobby', ({ lobbyId, userId }) => {
        const lobby = lobbies.get(lobbyId);
        if (lobby && lobby.members.includes(userId)) {
            socket.join(`lobby_${lobbyId}`);
            io.to(`lobby_${lobbyId}`).emit('user_joined', { userId });
        }
    });

    socket.on('toggle_ready', ({ lobbyId, userId }) => {
        const lobby = lobbies.get(lobbyId);
        if (lobby && lobby.members.includes(userId)) {
            lobby.readyStatus[userId] = !lobby.readyStatus[userId];
            io.to(`lobby_${lobbyId}`).emit('ready_updated', { userId, isReady: lobby.readyStatus[userId] });

            const allReady = lobby.members.every(memberId => lobby.readyStatus[memberId]);
            if (allReady && lobby.members.length > 1) {
                // Match Started
                lobby.status = 'in_match';
                const matchId = uuidv4();
                matches.set(matchId, {
                    id: matchId,
                    lobbyId,
                    players: [...lobby.members],
                    status: 'active'
                });
                io.to(`lobby_${lobbyId}`).emit('match_started', { matchId });
            }
        }
    });
};
