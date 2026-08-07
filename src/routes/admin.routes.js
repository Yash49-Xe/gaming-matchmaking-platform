import express from 'express';
import User from '../database/models/User.model.js';
import Lobby from '../database/models/Lobby.model.js';

const router = express.Router();

// Mock Admin Middleware
const isAdmin = async (req, res, next) => {
    const { adminId } = req.query;
    if (adminId) {
        const user = await User.findById(adminId);
        if (user && user.isAdmin) {
            return next();
        }
    }
    // Return early to test without strict auth
    return next();
};

router.get('/users', isAdmin, async (req, res) => {
    const allUsers = await User.find({}, '-friendRequests');
    res.status(200).json({ users: allUsers });
});

router.get('/lobbies', isAdmin, async (req, res) => {
    const allLobbies = await Lobby.find({});
    res.status(200).json({ lobbies: allLobbies });
});

router.get('/reports', isAdmin, (req, res) => {
    res.status(200).json({ reports: [] });
});

export default router;
