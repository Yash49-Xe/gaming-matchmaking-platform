import express from 'express';
import User from '../database/models/User.model.js';
import queueService from '../Services/queue.service.js';

const router = express.Router();

router.post('/find', async (req, res) => {
    try {
        const { userId, elo, game, rank, region, role } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const queued = await queueService.joinQueue(userId, elo || user.elo, { game, rank, region, role });
        
        if (queued) {
            res.status(200).json({ message: 'Joined matchmaking queue' });
        } else {
            res.status(400).json({ error: 'Already in queue' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/suggest', async (req, res) => {
    try {
        const { userId } = req.query;
        
        const players = await queueService.getQueuePlayers();
        
        // Matchmaking engine logic - suggest everyone else in queue
        // In a real app we would compute scores
        const suggestionsPromises = players
            .filter(p => p.userId !== userId)
            .map(async (p) => {
                const user = await User.findById(p.userId);
                return {
                    ...p,
                    username: user?.username,
                    compatibilityScore: Math.floor(Math.random() * 100)
                };
            });
            
        const suggestions = await Promise.all(suggestionsPromises);

        res.status(200).json({ suggestions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/invite', (req, res) => {
    const { fromUserId, toUserId } = req.body;
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
