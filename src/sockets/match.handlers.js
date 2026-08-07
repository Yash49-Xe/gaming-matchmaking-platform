import { matches, users } from '../utils/mockData.js';

export const setupMatchSockets = (socket, io) => {
    socket.on('join_match', ({ matchId }) => {
        socket.join(`match_${matchId}`);
    });

    socket.on('report_result', ({ matchId, winnerId }) => {
        const match = matches.get(matchId);
        if (match && match.status === 'active') {
            match.status = 'finished';
            match.result = { winnerId };

            // Update stats/rank
            if (winnerId && users.has(winnerId)) {
                const winner = users.get(winnerId);
                winner.elo += 25; // mock increase
            }
            
            // Losers stats update omitted for brevity in mock

            io.to(`match_${matchId}`).emit('match_finished', { match });
        }
    });
};
