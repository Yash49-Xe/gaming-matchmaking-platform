import express from 'express';
import User from '../database/models/User.model.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate('friends', 'username status elo');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({ friends: user.friends });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/request', async (req, res) => {
    try {
        const { fromUserId, toUserId } = req.body;
        
        const toUser = await User.findById(toUserId);
        if (!toUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }
        
        if (!toUser.friendRequests.includes(fromUserId) && !toUser.friends.includes(fromUserId)) {
            toUser.friendRequests.push(fromUserId);
            await toUser.save();
        }
        
        res.status(200).json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/respond', async (req, res) => {
    try {
        const { targetUserId, fromUserId, accept } = req.body;
        
        const targetUser = await User.findById(targetUserId);
        const fromUser = await User.findById(fromUserId);
        
        if (!targetUser || !fromUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (targetUser.friendRequests.includes(fromUserId)) {
            targetUser.friendRequests = targetUser.friendRequests.filter(id => id.toString() !== fromUserId);
            
            if (accept) {
                targetUser.friends.push(fromUserId);
                fromUser.friends.push(targetUserId);
                await fromUser.save();
            }
            
            await targetUser.save();
            return res.status(200).json({ message: accept ? 'Friend request accepted' : 'Friend request ignored' });
        }
        
        res.status(404).json({ error: 'Request not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
