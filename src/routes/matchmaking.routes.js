import express from 'express';
import { users, queue } from '../utils/mockData.js';
import queueService from '../Services/queue.service.js';

const router = express.Router();

router.post('/find', async (req, res) => {
    const { userId, elo, game, rank, region, role } = req.body;
    
    if (!users.has(userId)) {
        return res.status(404).json({ error: 'User not found' });
    }

    const queued = await queueService.joinQueue(userId, elo, { game, rank, region, role });
    
    if (queued) {
        res.status(200).json({ message: 'Joined matchmaking queue' });
    } else {
        res.status(400).json({ error: 'Already in queue' });
    }
});

router.get('/suggest', async (req, res) => {
    const { userId } = req.query;
    
    const players = await queueService.getQueuePlayers();
    
    // Very basic matchmaking engine mock - suggest everyone else in queue
    const suggestions = players
        .filter(p => p.userId !== userId)
        .map(p => {
            const user = users.get(p.userId);
            return {
                ...p,
                username: user?.username,
                compatibilityScore: Math.floor(Math.random() * 100) // Mock score
            };
        });

    res.status(200).json({ suggestions });
});

router.post('/invite', (req, res) => {
    const { fromUserId, toUserId } = req.body;
    // In a real app, emit a socket event to toUserId
    res.status(200).json({ message: 'Invite sent', fromUserId, toUserId });
});

router.post('/invite/respond', (req, res) => {
    const { inviteId, accept } = req.body;
    if (accept) {
        res.status(200).json({ message: 'Invite accepted, entering lobby' });
    } else {
        res.status(200).json({ message: 'Invite ignored' });
    }
});

export default router;
