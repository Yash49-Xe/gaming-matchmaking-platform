import express from 'express';
import Lobby from '../database/models/Lobby.model.js';
import User from '../database/models/User.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const publicLobbies = await Lobby.find({ isPublic: true }).populate('leaderId members', 'username elo');
        res.status(200).json({ lobbies: publicLobbies });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, game, leaderId, isPublic } = req.body;
        
        const leader = await User.findById(leaderId);
        if (!leader) {
            return res.status(404).json({ error: 'Leader not found' });
        }

        const newLobby = new Lobby({
            name,
            game,
            leaderId,
            members: [leaderId],
            status: 'waiting',
            isPublic: isPublic !== false, // default true
            readyStatus: { [leaderId]: false }
        });

        await newLobby.save();
        res.status(201).json({ message: 'Lobby created', lobby: newLobby });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/join-request', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const lobby = await Lobby.findById(id);
        if (!lobby) {
            return res.status(404).json({ error: 'Lobby not found' });
        }
        
        if (!lobby.joinRequests.includes(userId)) {
            lobby.joinRequests.push(userId);
            await lobby.save();
        }
        
        res.status(200).json({ message: 'Join request sent to leader' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/join-respond', async (req, res) => {
    try {
        const { id } = req.params;
        const { leaderId, userId, accept } = req.body;

        const lobby = await Lobby.findById(id);
        if (!lobby || lobby.leaderId.toString() !== leaderId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (lobby.joinRequests.includes(userId)) {
            lobby.joinRequests = lobby.joinRequests.filter(reqId => reqId.toString() !== userId);
            
            if (accept) {
                if (!lobby.members.includes(userId)) {
                    lobby.members.push(userId);
                }
                lobby.readyStatus.set(userId, false);
                await lobby.save();
                return res.status(200).json({ message: 'Request accepted', lobby });
            } else {
                await lobby.save();
                return res.status(200).json({ message: 'Request rejected' });
            }
        }
        
        res.status(404).json({ error: 'Request not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
