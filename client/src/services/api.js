// Gaming Matchmaking Platform - API Service Client
const MOCK_STORAGE_KEY = "gmp_mock_db";

// Helper to get/set mock DB
const getMockDB = () => {
  let db = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!db) {
    db = {
      users: [
        { id: "u1", username: "AceSlayer", email: "ace@gmp.com", role: "player" },
        { id: "u2", username: "P1stoland", email: "pistol@gmp.com", role: "player" },
        { id: "u3", username: "ShadowSniper", email: "shadow@gmp.com", role: "player" },
        { id: "u4", username: "HealBot", email: "heal@gmp.com", role: "player" },
        { id: "u5", username: "TacticNode", email: "tactic@gmp.com", role: "player" },
        { id: "admin", username: "SuperAdmin", email: "admin@gmp.com", role: "admin" }
      ],
      profiles: {
        "u1": { game: "Valorant", rank: "Diamond", region: "EU West", role: "Duelist", elo: 1850 },
        "u2": { game: "CS2", rank: "Global Elite", region: "NA East", role: "Entry Fragger", elo: 2400 },
        "u3": { game: "Valorant", rank: "Diamond", region: "EU West", role: "Initiator", elo: 1810 },
        "u4": { game: "Valorant", rank: "Platinum", region: "EU West", role: "Sentinel", elo: 1680 },
        "u5": { game: "Valorant", rank: "Diamond", region: "EU West", role: "Controller", elo: 1790 },
      },
      lobbies: [
        { id: "l1", game: "Valorant", name: "Ranked Push to Ascendant", region: "EU West", rank: "Diamond", maxPlayers: 5, leaderId: "u1", leaderName: "AceSlayer", members: [{ id: "u1", username: "AceSlayer", role: "Duelist", isReady: true }], status: "open" },
        { id: "l2", game: "CS2", name: "Premier 20k+ Stack", region: "NA East", rank: "Global Elite", maxPlayers: 5, leaderId: "u2", leaderName: "P1stoland", members: [{ id: "u2", username: "P1stoland", role: "Entry Fragger", isReady: true }], status: "open" },
        { id: "l3", game: "Apex Legends", name: "Ranked Masters Grind", region: "Asia", rank: "Diamond", maxPlayers: 3, leaderId: "u3", leaderName: "ShadowSniper", members: [{ id: "u3", username: "ShadowSniper", role: "Recon", isReady: true }], status: "open" }
      ],
      friends: [
        { id: "u2", username: "P1stoland", status: "online", game: "CS2" },
        { id: "u3", username: "ShadowSniper", status: "busy", game: "Valorant" },
        { id: "u4", username: "HealBot", status: "offline", game: null }
      ],
      friendRequests: [
        { id: "fr1", fromId: "u5", fromUsername: "TacticNode", status: "pending" }
      ],
      stats: {
        gamesPlayed: 142,
        winRate: 56.4,
        currentElo: 1820,
        winStreak: 4,
        history: [
          { id: "m1", game: "Valorant", date: "2026-07-17", result: "Win", score: "13-8", eloChange: 22 },
          { id: "m2", game: "Valorant", date: "2026-07-16", result: "Win", score: "13-11", eloChange: 18 },
          { id: "m3", game: "Valorant", date: "2026-07-15", result: "Loss", score: "7-13", eloChange: -15 },
          { id: "m4", game: "Valorant", date: "2026-07-14", result: "Win", score: "13-5", eloChange: 25 },
          { id: "m5", game: "Valorant", date: "2026-07-12", result: "Win", score: "13-9", eloChange: 20 }
        ],
        eloHistory: [1750, 1775, 1760, 1785, 1805, 1820]
      },
      reports: [
        { id: "r1", reporter: "AceSlayer", reported: "ToxicGamer123", reason: "Griefing and toxic text chat in lobby room", status: "pending" }
      ]
    };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
  } else {
    db = JSON.parse(db);
  }
  return db;
};

const saveMockDB = (db) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
};

// Simulation Delay
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  constructor() {
    this.useMock = true; // Set to false to connect to the actual backend API
    this.token = localStorage.getItem("gmp_token");
    this.currentUser = JSON.parse(localStorage.getItem("gmp_user") || "null");
  }

  setMockMode(booleanVal) {
    this.useMock = booleanVal;
  }

  // --- Helper Request wrapper ---
  async request(endpoint, options = {}) {
    if (this.token) {
      options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json"
      };
    }
    const res = await fetch(endpoint, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || "Something went wrong");
    }
    return res.json();
  }

  // --- AUTHENTICATION ---
  async login(username, password) {
    if (this.useMock) {
      await delay(600);
      const db = getMockDB();
      const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
      
      if (!user) {
        throw new Error("Invalid username or password");
      }

      this.token = "mock_token_" + user.id;
      this.currentUser = user;
      localStorage.setItem("gmp_token", this.token);
      localStorage.setItem("gmp_user", JSON.stringify(user));
      return { user, token: this.token };
    } else {
      const data = await this.request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem("gmp_token", this.token);
      localStorage.setItem("gmp_user", JSON.stringify(data.user));
      return data;
    }
  }

  async register(username, email, password) {
    if (this.useMock) {
      await delay(700);
      const db = getMockDB();
      if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Username or Email already exists");
      }
      
      const newUser = {
        id: "u_" + Math.random().toString(36).substr(2, 9),
        username,
        email,
        role: "player"
      };
      
      db.users.push(newUser);
      saveMockDB(db);

      // Log in automatically
      this.token = "mock_token_" + newUser.id;
      this.currentUser = newUser;
      localStorage.setItem("gmp_token", this.token);
      localStorage.setItem("gmp_user", JSON.stringify(newUser));
      return { user: newUser, token: this.token };
    } else {
      const data = await this.request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password })
      });
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem("gmp_token", this.token);
      localStorage.setItem("gmp_user", JSON.stringify(data.user));
      return data;
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem("gmp_token");
    localStorage.removeItem("gmp_user");
  }

  // --- GAMING PROFILE ---
  async getProfile() {
    if (this.useMock) {
      await delay(300);
      if (!this.currentUser) throw new Error("Unauthorized");
      const db = getMockDB();
      return db.profiles[this.currentUser.id] || null;
    } else {
      return this.request("/api/profile");
    }
  }

  async saveProfile(profileData) {
    if (this.useMock) {
      await delay(500);
      if (!this.currentUser) throw new Error("Unauthorized");
      const db = getMockDB();
      
      const profile = {
        ...profileData,
        elo: db.profiles[this.currentUser.id]?.elo || 1200 // Initial ELO standard
      };
      
      db.profiles[this.currentUser.id] = profile;
      saveMockDB(db);
      return profile;
    } else {
      return this.request("/api/profile", {
        method: "POST",
        body: JSON.stringify(profileData)
      });
    }
  }

  // --- MATCHMAKING ENGINE ---
  async searchPlayers(criteria) {
    if (this.useMock) {
      await delay(1200); // Simulate engine processing compatibility scores
      const db = getMockDB();
      const userProfile = db.profiles[this.currentUser.id] || { game: "Valorant", rank: "Platinum", region: "EU West", role: "Flex", elo: 1500 };
      
      // Filter players who aren't the current user and play the same game
      const suggested = Object.entries(db.profiles)
        .filter(([uid, prof]) => uid !== this.currentUser.id && prof.game === userProfile.game)
        .map(([uid, prof]) => {
          const userObj = db.users.find(u => u.id === uid);
          // Calculate a simulated compatibility score based on rank, region and role
          let compatibility = 75;
          if (prof.region === userProfile.region) compatibility += 10;
          if (prof.rank === userProfile.rank) compatibility += 8;
          if (prof.role !== userProfile.role) compatibility += 7; // Complementary roles
          
          compatibility = Math.min(compatibility, 99);

          return {
            id: uid,
            username: userObj?.username || "Gamer",
            rank: prof.rank,
            region: prof.region,
            role: prof.role,
            elo: prof.elo,
            compatibilityScore: compatibility
          };
        })
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      return suggested;
    } else {
      const query = new URLSearchParams(criteria).toString();
      return this.request(`/api/matchmaker/search?${query}`);
    }
  }

  // --- LOBBY SYSTEM ---
  async getLobbies() {
    if (this.useMock) {
      await delay(400);
      const db = getMockDB();
      return db.lobbies;
    } else {
      return this.request("/api/lobbies");
    }
  }

  async createLobby(lobbyData) {
    if (this.useMock) {
      await delay(500);
      if (!this.currentUser) throw new Error("Unauthorized");
      const db = getMockDB();
      const profile = db.profiles[this.currentUser.id] || { role: "Flex" };
      
      const newLobby = {
        id: "l_" + Math.random().toString(36).substr(2, 9),
        name: lobbyData.name,
        game: lobbyData.game,
        region: lobbyData.region,
        rank: lobbyData.rank,
        maxPlayers: parseInt(lobbyData.maxPlayers) || 5,
        leaderId: this.currentUser.id,
        leaderName: this.currentUser.username,
        members: [{
          id: this.currentUser.id,
          username: this.currentUser.username,
          role: profile.role || "Flex",
          isReady: true // Leader is always ready
        }],
        status: "open"
      };

      db.lobbies.push(newLobby);
      saveMockDB(db);
      return newLobby;
    } else {
      return this.request("/api/lobbies", {
        method: "POST",
        body: JSON.stringify(lobbyData)
      });
    }
  }

  async getLobbyDetails(lobbyId) {
    if (this.useMock) {
      await delay(200);
      const db = getMockDB();
      const lobby = db.lobbies.find(l => l.id === lobbyId);
      if (!lobby) throw new Error("Lobby not found");
      return lobby;
    } else {
      return this.request(`/api/lobbies/${lobbyId}`);
    }
  }

  // --- PLAYER STATISTICS ---
  async getPlayerStats() {
    if (this.useMock) {
      await delay(300);
      const db = getMockDB();
      return db.stats;
    } else {
      return this.request("/api/stats");
    }
  }

  async submitMatchResult(lobbyId, result) {
    if (this.useMock) {
      await delay(500);
      const db = getMockDB();
      const lobbyIndex = db.lobbies.findIndex(l => l.id === lobbyId);
      
      if (lobbyIndex !== -1) {
        // Remove lobby (since match is over)
        const lobby = db.lobbies[lobbyIndex];
        db.lobbies.splice(lobbyIndex, 1);
        
        // Update stats
        const isWin = result === "Win";
        const eloChange = isWin ? Math.floor(Math.random() * 10) + 18 : -(Math.floor(Math.random() * 10) + 12);
        
        db.stats.gamesPlayed += 1;
        db.stats.currentElo += eloChange;
        db.stats.winStreak = isWin ? db.stats.winStreak + 1 : 0;
        
        // recalculate winrate
        const wins = db.stats.history.filter(h => h.result === "Win").length + (isWin ? 1 : 0);
        db.stats.winRate = parseFloat(((wins / db.stats.gamesPlayed) * 100).toFixed(1));
        
        db.stats.history.unshift({
          id: "m_" + Math.random().toString(36).substr(2, 9),
          game: lobby.game,
          date: new Date().toISOString().split("T")[0],
          result: result,
          score: isWin ? "13-7" : "9-13",
          eloChange: eloChange
        });

        db.stats.eloHistory.push(db.stats.currentElo);
        if (db.stats.eloHistory.length > 8) db.stats.eloHistory.shift();

        saveMockDB(db);
      }
      return { success: true, stats: db.stats };
    } else {
      return this.request(`/api/lobbies/${lobbyId}/result`, {
        method: "POST",
        body: JSON.stringify({ result })
      });
    }
  }

  // --- FRIENDS SYSTEM ---
  async getFriends() {
    if (this.useMock) {
      await delay(300);
      const db = getMockDB();
      return db.friends;
    } else {
      return this.request("/api/friends");
    }
  }

  async getFriendRequests() {
    if (this.useMock) {
      await delay(300);
      const db = getMockDB();
      return db.friendRequests;
    } else {
      return this.request("/api/friends/requests");
    }
  }

  async sendFriendRequest(targetUsername) {
    if (this.useMock) {
      await delay(400);
      const db = getMockDB();
      const targetUser = db.users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
      
      if (!targetUser) {
        throw new Error("User not found");
      }
      if (targetUser.id === this.currentUser.id) {
        throw new Error("You cannot add yourself");
      }
      if (db.friends.find(f => f.id === targetUser.id)) {
        throw new Error("User is already your friend");
      }
      if (db.friendRequests.find(r => r.fromId === targetUser.id || (r.fromId === this.currentUser.id && r.targetId === targetUser.id))) {
        throw new Error("A request is already pending between you two");
      }

      db.friendRequests.push({
        id: "fr_" + Math.random().toString(36).substr(2, 9),
        fromId: this.currentUser.id,
        fromUsername: this.currentUser.username,
        targetId: targetUser.id,
        status: "pending"
      });
      saveMockDB(db);
      return { success: true };
    } else {
      return this.request("/api/friends/request", {
        method: "POST",
        body: JSON.stringify({ username: targetUsername })
      });
    }
  }

  async handleFriendRequest(requestId, accept) {
    if (this.useMock) {
      await delay(400);
      const db = getMockDB();
      const requestIndex = db.friendRequests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error("Request not found");
      }

      const req = db.friendRequests[requestIndex];
      db.friendRequests.splice(requestIndex, 1);

      if (accept) {
        // Add to friends
        db.friends.push({
          id: req.fromId,
          username: req.fromUsername,
          status: "online",
          game: null
        });
      }
      saveMockDB(db);
      return { success: true };
    } else {
      return this.request(`/api/friends/requests/${requestId}`, {
        method: "PUT",
        body: JSON.stringify({ accept })
      });
    }
  }

  // --- ADMIN PANEL ---
  async getAdminReports() {
    if (this.useMock) {
      await delay(300);
      const db = getMockDB();
      return db.reports;
    } else {
      return this.request("/api/admin/reports");
    }
  }

  async getAdminUsers() {
    if (this.useMock) {
      await delay(300);
      const db = getMockDB();
      return db.users;
    } else {
      return this.request("/api/admin/users");
    }
  }

  async banUser(userId) {
    if (this.useMock) {
      await delay(500);
      const db = getMockDB();
      const userIdx = db.users.findIndex(u => u.id === userId);
      if (userIdx !== -1) {
        const username = db.users[userIdx].username;
        db.users.splice(userIdx, 1);
        // Clean up from profiles
        delete db.profiles[userId];
        // Clean up reports
        db.reports = db.reports.filter(r => r.reported !== username);
        saveMockDB(db);
      }
      return { success: true };
    } else {
      return this.request(`/api/admin/users/${userId}/ban`, {
        method: "POST"
      });
    }
  }
}

export default new ApiService();
