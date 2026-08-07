import express from 'express';
import User from '../database/models/User.model.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, game, region, rank, role } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = new User({
            username,
            game: game || 'unknown',
            region: region || 'unknown',
            rank: rank || 'unranked',
            role: role || 'any',
            elo: 1000,
            status: 'online',
            isAdmin: false
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered', user: newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username } = req.body;
        
        const foundUser = await User.findOne({ username });
        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        foundUser.status = 'online';
        await foundUser.save();
        
        res.status(200).json({ message: 'Login successful', user: foundUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
