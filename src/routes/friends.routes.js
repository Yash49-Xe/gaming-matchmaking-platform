import express from 'express';
import { friends, friendRequests, users } from '../utils/mockData.js';

const router = express.Router();

router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    const userFriends = friends.get(userId) || new Set();
    const friendList = Array.from(userFriends).map(id => users.get(id));
    
    res.status(200).json({ friends: friendList });
});

router.post('/request', (req, res) => {
    const { fromUserId, toUserId } = req.body;
    
    if (!friendRequests.has(toUserId)) {
        friendRequests.set(toUserId, new Set());
    }
    friendRequests.get(toUserId).add(fromUserId);
    
    res.status(200).json({ message: 'Friend request sent' });
});

router.post('/respond', (req, res) => {
    const { targetUserId, fromUserId, accept } = req.body;
    
    const requests = friendRequests.get(targetUserId);
    if (requests && requests.has(fromUserId)) {
        requests.delete(fromUserId);
        
        if (accept) {
            if (!friends.has(targetUserId)) friends.set(targetUserId, new Set());
            if (!friends.has(fromUserId)) friends.set(fromUserId, new Set());
            
            friends.get(targetUserId).add(fromUserId);
            friends.get(fromUserId).add(targetUserId);
            
            return res.status(200).json({ message: 'Friend request accepted' });
        } else {
            return res.status(200).json({ message: 'Friend request ignored' });
        }
    }
    
    res.status(404).json({ error: 'Request not found' });
});

export default router;
