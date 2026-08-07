import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { users } from '../utils/mockData.js';

const router = express.Router();

// Mock Register/Login -> Create Gaming Profile
router.post('/register', (req, res) => {
    const { username, game, region, rank, role } = req.body;
    
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const userId = uuidv4();
    const newUser = {
        id: userId,
        username,
        game: game || 'unknown',
        region: region || 'unknown',
        rank: rank || 'unranked',
        role: role || 'any',
        elo: 1000,
        status: 'online',
        isAdmin: false
    };

    users.set(userId, newUser);
    res.status(201).json({ message: 'User registered', user: newUser });
});

router.post('/login', (req, res) => {
    const { username } = req.body;
    let foundUser = null;
    
    for (const [id, user] of users.entries()) {
        if (user.username === username) {
            foundUser = user;
            break;
        }
    }

    if (!foundUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    foundUser.status = 'online';
    res.status(200).json({ message: 'Login successful', user: foundUser });
});

export default router;
