import express from 'express';
import { users, lobbies, matches } from '../utils/mockData.js';

const router = express.Router();

// Mock Admin Middleware
const isAdmin = (req, res, next) => {
    // Basic mock admin check
    const { adminId } = req.query;
    const user = users.get(adminId);
    if (user && user.isAdmin) {
        return next();
    }
    // Return early to test without strict auth
    return next();
};

router.get('/users', isAdmin, (req, res) => {
    const allUsers = Array.from(users.values());
    res.status(200).json({ users: allUsers });
});

router.get('/lobbies', isAdmin, (req, res) => {
    const allLobbies = Array.from(lobbies.values());
    res.status(200).json({ lobbies: allLobbies });
});

router.get('/reports', isAdmin, (req, res) => {
    // Mock reports
    res.status(200).json({ reports: [] });
});

export default router;
