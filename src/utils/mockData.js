// In-memory data structures to replace DB for now
export const users = new Map();
export const lobbies = new Map();
export const matches = new Map();
export const friends = new Map(); // userId -> Set of friend userIds
export const friendRequests = new Map(); // targetUserId -> Set of fromUserIds
export const lobbyJoinRequests = new Map(); // lobbyId -> Set of userIds

export const queue = []; // Array of { userId, elo, game, rank, region, role }

// Some initial seed data
users.set('user1', { id: 'user1', username: 'PlayerOne', elo: 1200, status: 'online' });
users.set('user2', { id: 'user2', username: 'PlayerTwo', elo: 1250, status: 'online' });

// Lobby structure: { id, name, game, leaderId, members: [userIds], status, isPublic }
// Match structure: { id, lobbyId, players: [userIds], status, result }
