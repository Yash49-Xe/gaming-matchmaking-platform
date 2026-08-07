import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { lobbies, lobbyJoinRequests, users } from '../utils/mockData.js';

const router = express.Router();

router.get('/', (req, res) => {
    const publicLobbies = Array.from(lobbies.values()).filter(l => l.isPublic);
    res.status(200).json({ lobbies: publicLobbies });
});

router.post('/', (req, res) => {
    const { name, game, leaderId, isPublic } = req.body;
    
    if (!users.has(leaderId)) {
        return res.status(404).json({ error: 'Leader not found' });
    }

    const lobbyId = uuidv4();
    const newLobby = {
        id: lobbyId,
        name,
        game,
        leaderId,
        members: [leaderId],
        status: 'waiting',
        isPublic: isPublic !== false, // default true
        readyStatus: { [leaderId]: false }
    };

    lobbies.set(lobbyId, newLobby);
    res.status(201).json({ message: 'Lobby created', lobby: newLobby });
});

router.post('/:id/join-request', (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!lobbies.has(id)) {
        return res.status(404).json({ error: 'Lobby not found' });
    }
    
    if (!lobbyJoinRequests.has(id)) {
        lobbyJoinRequests.set(id, new Set());
    }
    lobbyJoinRequests.get(id).add(userId);
    
    res.status(200).json({ message: 'Join request sent to leader' });
});

router.post('/:id/join-respond', (req, res) => {
    const { id } = req.params;
    const { leaderId, userId, accept } = req.body;

    const lobby = lobbies.get(id);
    if (!lobby || lobby.leaderId !== leaderId) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    const requests = lobbyJoinRequests.get(id);
    if (requests && requests.has(userId)) {
        requests.delete(userId);
        if (accept) {
            lobby.members.push(userId);
            lobby.readyStatus[userId] = false;
            return res.status(200).json({ message: 'Request accepted', lobby });
        } else {
            return res.status(200).json({ message: 'Request rejected' });
        }
    }
    
    res.status(404).json({ error: 'Request not found' });
});

export default router;
