// Gaming Matchmaking Platform - Socket Service Client
import { io } from "socket.io-client";
import api from "./api";

class SocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {};
    this.simulatedTimers = [];
  }

  connect() {
    if (api.useMock) {
      console.log("🔌 Simulated Socket connected.");
      return;
    }

    if (!this.socket) {
      // Connect to the server using the configured proxy root
      this.socket = io({
        autoConnect: true,
        reconnection: true
      });

      // Bind listener gateways
      this.socket.on("connect", () => console.log("✅ WebSocket connected to server"));
      this.socket.on("disconnect", () => console.log("❌ WebSocket disconnected"));
      
      this.socket.on("lobby:update", (data) => this._trigger("lobbyUpdate", data));
      this.socket.on("chat:message", (data) => this._trigger("chatMessage", data));
      this.socket.on("match:started", (data) => this._trigger("matchStarted", data));
      this.socket.on("queue:match_found", (data) => this._trigger("matchFound", data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearSimulation();
  }

  // Register event callbacks
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  _trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  clearSimulation() {
    this.simulatedTimers.forEach(timer => clearTimeout(timer));
    this.simulatedTimers = [];
  }

  // --- QUEUE ACTIONS ---
  joinQueue(userId, elo, criteria) {
    this.connect();
    
    if (api.useMock) {
      console.log(`[Queue] Player ${userId} joined queue with ELO ${elo}`);
      
      // Simulate matchmaking delay
      this.clearSimulation();
      const timer = setTimeout(() => {
        // Create a simulated matching lobby
        const mockLobbyId = "l_match_" + Math.random().toString(36).substr(2, 9);
        const db = JSON.parse(localStorage.getItem("gmp_mock_db") || "{}");
        const profile = db.profiles[userId] || { role: "Flex", rank: "Platinum", game: "Valorant" };
        
        // Add fake lobby
        const newLobby = {
          id: mockLobbyId,
          name: `${profile.game} Matchmade Lobby`,
          game: profile.game,
          region: profile.region || "EU West",
          rank: profile.rank || "Platinum",
          maxPlayers: 5,
          leaderId: "u3", // Mock Leader is ShadowSniper
          leaderName: "ShadowSniper",
          members: [
            { id: "u3", username: "ShadowSniper", role: "Duelist", isReady: false },
            { id: "u4", username: "HealBot", role: "Support", isReady: false },
            { id: userId, username: api.currentUser?.username || "Gamer", role: profile.role || "Flex", isReady: false }
          ],
          status: "open"
        };
        
        db.lobbies.push(newLobby);
        localStorage.setItem("gmp_mock_db", JSON.stringify(db));

        this._trigger("matchFound", {
          lobbyId: mockLobbyId,
          lobby: newLobby,
          compatibilityScore: 94
        });
      }, 3500);

      this.simulatedTimers.push(timer);
    } else {
      this.socket.emit("queue:join", { userId, elo, criteria });
    }
  }

  leaveQueue(userId) {
    if (api.useMock) {
      console.log(`[Queue] Player ${userId} left queue`);
      this.clearSimulation();
    } else {
      if (this.socket) {
        this.socket.emit("queue:leave", { userId });
      }
    }
  }

  // --- LOBBY ACTIONS ---
  joinLobby(lobbyId, userId) {
    this.connect();

    if (api.useMock) {
      console.log(`[Lobby] Player ${userId} joined lobby ${lobbyId}`);
      this.clearSimulation();

      // Fetch lobby details from mock DB
      const db = JSON.parse(localStorage.getItem("gmp_mock_db") || "{}");
      const lobby = db.lobbies?.find(l => l.id === lobbyId);
      if (!lobby) return;

      // Add user if not already in members
      if (!lobby.members.some(m => m.id === userId)) {
        const profile = db.profiles[userId] || { role: "Flex" };
        lobby.members.push({
          id: userId,
          username: api.currentUser?.username || "Gamer",
          role: profile.role || "Flex",
          isReady: false
        });
        localStorage.setItem("gmp_mock_db", JSON.stringify(db));
      }

      this._trigger("lobbyUpdate", lobby);

      // Trigger standard welcome message
      const systemMsg = {
        id: "msg_" + Math.random(),
        sender: "System",
        text: `${api.currentUser?.username || "Gamer"} joined the lobby room.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTimeout(() => this._trigger("chatMessage", systemMsg), 100);

      // Simulate a chat conversation from teammate
      const lobbyTeammates = lobby.members.filter(m => m.id !== userId);
      if (lobbyTeammates.length > 0) {
        const replyTimer = setTimeout(() => {
          const sender = lobbyTeammates[Math.floor(Math.random() * lobbyTeammates.length)];
          const texts = ["Hey there!", "Welcome!", "Ready to win?", "What role are you playing?", "Let's go!"];
          const botMsg = {
            id: "msg_" + Math.random(),
            sender: sender.username,
            text: texts[Math.floor(Math.random() * texts.length)],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          this._trigger("chatMessage", botMsg);
        }, 1500);
        this.simulatedTimers.push(replyTimer);
      }

      // Simulate another player joining if lobby isn't full
      if (lobby.members.length < lobby.maxPlayers) {
        const joinTimer = setTimeout(() => {
          const updatedDB = JSON.parse(localStorage.getItem("gmp_mock_db") || "{}");
          const freshLobby = updatedDB.lobbies?.find(l => l.id === lobbyId);
          if (!freshLobby || freshLobby.members.length >= freshLobby.maxPlayers) return;

          const activeUsernames = freshLobby.members.map(m => m.username);
          const candidates = [
            { id: "u2", username: "P1stoland", role: "Entry Fragger" },
            { id: "u4", username: "HealBot", role: "Support" },
            { id: "u5", username: "TacticNode", role: "Initiator" }
          ].filter(c => !activeUsernames.includes(c.username));

          if (candidates.length > 0) {
            const nextBot = candidates[0];
            freshLobby.members.push({
              id: nextBot.id,
              username: nextBot.username,
              role: nextBot.role,
              isReady: false
            });
            localStorage.setItem("gmp_mock_db", JSON.stringify(updatedDB));
            this._trigger("lobbyUpdate", freshLobby);
            
            this._trigger("chatMessage", {
              id: "msg_" + Math.random(),
              sender: "System",
              text: `${nextBot.username} joined the lobby room.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
        }, 6000);
        this.simulatedTimers.push(joinTimer);
      }
    } else {
      this.socket.emit("lobby:join", { lobbyId, userId });
    }
  }

  leaveLobby(lobbyId, userId) {
    if (api.useMock) {
      console.log(`[Lobby] Player ${userId} left lobby ${lobbyId}`);
      this.clearSimulation();
      
      const db = JSON.parse(localStorage.getItem("gmp_mock_db") || "{}");
      const lobby = db.lobbies?.find(l => l.id === lobbyId);
      if (lobby) {
        lobby.members = lobby.members.filter(m => m.id !== userId);
        // If empty, delete it
        if (lobby.members.length === 0) {
          db.lobbies = db.lobbies.filter(l => l.id !== lobbyId);
        } else if (lobby.leaderId === userId) {
          // Pass leadership
          lobby.leaderId = lobby.members[0].id;
          lobby.leaderName = lobby.members[0].username;
        }
        localStorage.setItem("gmp_mock_db", JSON.stringify(db));
        
        if (lobby.members.length > 0) {
          this._trigger("lobbyUpdate", lobby);
        }
      }
    } else {
      if (this.socket) {
        this.socket.emit("lobby:leave", { lobbyId, userId });
      }
    }
  }

  sendMessage(lobbyId, senderName, text) {
    if (api.useMock) {
      console.log(`[Chat] Msg from ${senderName}: ${text}`);
      const userMsg = {
        id: "msg_" + Math.random(),
        sender: senderName,
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      this._trigger("chatMessage", userMsg);

      // Simulate a response to specific words or general chatter
      const answerTimer = setTimeout(() => {
        const db = JSON.parse(localStorage.getItem("gmp_mock_db") || "{}");
        const lobby = db.lobbies?.find(l => l.id === lobbyId);
        if (!lobby) return;

        const otherMembers = lobby.members.filter(m => m.username !== senderName);
        if (otherMembers.length === 0) return;

        const responder = otherMembers[Math.floor(Math.random() * otherMembers.length)];
        let replyText = "Ready to play? Set your state to ready!";
        
        const lowerText = text.toLowerCase();
        if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey")) {
          replyText = `Yo ${senderName}! GLHF`;
        } else if (lowerText.includes("role") || lowerText.includes("play")) {
          replyText = `I am going to play ${responder.role}. What about others?`;
        } else if (lowerText.includes("strat") || lowerText.includes("win")) {
          replyText = "Let's stick together and communicate. Easy game!";
        } else if (lowerText.includes("ready")) {
          replyText = "Clicking ready now!";
          
          // Toggle this bot's ready status soon
          setTimeout(() => {
            this.toggleReady(lobbyId, responder.id, true);
          }, 1200);
        }

        this._trigger("chatMessage", {
          id: "msg_" + Math.random(),
          sender: responder.username,
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }, 1500);

      this.simulatedTimers.push(answerTimer);
    } else {
      this.socket.emit("chat:send", { lobbyId, sender: senderName, text });
    }
  }

  toggleReady(lobbyId, userId, isReady) {
    if (api.useMock) {
      console.log(`[Lobby] Player ${userId} toggled ready: ${isReady}`);
      
      const db = JSON.parse(localStorage.getItem("gmp_mock_db") || "{}");
      const lobby = db.lobbies?.find(l => l.id === lobbyId);
      if (!lobby) return;

      const member = lobby.members.find(m => m.id === userId);
      if (member) {
        member.isReady = isReady;
        localStorage.setItem("gmp_mock_db", JSON.stringify(db));
        this._trigger("lobbyUpdate", lobby);
      }

      // Check if all members are ready
      const allReady = lobby.members.every(m => m.isReady);
      if (allReady) {
        // Trigger system match countdown
        const startTimer = setTimeout(() => {
          this._trigger("chatMessage", {
            id: "msg_sys_start",
            sender: "System",
            text: "🎮 All players ready! Starting Match...",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          
          lobby.status = "in-progress";
          db.lobbies = db.lobbies.map(l => l.id === lobbyId ? lobby : l);
          localStorage.setItem("gmp_mock_db", JSON.stringify(db));
          
          this._trigger("lobbyUpdate", lobby);
          this._trigger("matchStarted", { lobbyId, status: "started" });
        }, 1500);
        this.simulatedTimers.push(startTimer);
      } else {
        // If not all ready, simulate bots turning on ready after some time
        const unreadyBots = lobby.members.filter(m => !m.isReady && m.id !== api.currentUser?.id);
        if (unreadyBots.length > 0 && isReady) {
          // User clicked ready, make one bot click ready in 2 seconds
          const botReadyTimer = setTimeout(() => {
            const nextBot = unreadyBots[Math.floor(Math.random() * unreadyBots.length)];
            this.toggleReady(lobbyId, nextBot.id, true);
          }, 2000);
          this.simulatedTimers.push(botReadyTimer);
        }
      }
    } else {
      this.socket.emit("lobby:ready", { lobbyId, userId, isReady });
    }
  }
}

export default new SocketService();
