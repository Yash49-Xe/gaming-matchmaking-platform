import React, { useState, useEffect } from "react";
import api from "../services/api";
import socket from "../services/socket";
import Profile from "./Profile";
import Matchmaker from "./Matchmaker";
import LobbyList from "./LobbyList";
import LobbyRoom from "./LobbyRoom";
import Stats from "./Stats";
import Friends from "./Friends";
import Admin from "./Admin";
import { 
  Gamepad2, User, Users, Trophy, LogOut, Radio, LayoutDashboard, Shield, AlertTriangle
} from "lucide-react";

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(api.currentUser);
  const [userProfile, setUserProfile] = useState(null);
  const [activeLobbyId, setActiveLobbyId] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [matchNotification, setMatchNotification] = useState(null);

  // Load profile and stats on mount
  const loadData = async () => {
    try {
      const profile = await api.getProfile();
      setUserProfile(profile);
      
      const stats = await api.getPlayerStats();
      setPlayerStats(stats);
      
      // Update local storage user ELO if mock
      if (api.useMock && stats) {
        const freshUser = { ...api.currentUser, elo: stats.currentElo };
        setUser(freshUser);
      }
    } catch (err) {
      console.error("Dashboard failed to fetch user metadata:", err);
    }
  };

  useEffect(() => {
    loadData();

    // Socket listeners
    socket.connect();
    
    socket.on("matchFound", (data) => {
      console.log("Match Found socket trigger!", data);
      setMatchNotification(data);
      // Automatically navigate to lobby-room
      setActiveLobbyId(data.lobbyId);
      setActiveTab("lobby-room");
      
      // Clear alert after a few seconds
      setTimeout(() => {
        setMatchNotification(null);
      }, 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogoutClick = () => {
    api.logout();
    onLogout();
  };

  const handleProfileSaved = () => {
    loadData();
    setActiveTab("overview");
  };

  const handleJoinLobby = (lobbyId) => {
    setActiveLobbyId(lobbyId);
    setActiveTab("lobby-room");
  };

  const handleLeaveLobby = () => {
    setActiveLobbyId(null);
    loadData(); // reload stats in case game ended
    setActiveTab("lobbies");
  };

  // Dispatcher for Sub-Views
  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile onSaveSuccess={handleProfileSaved} />;
      case "matchmaker":
        return <Matchmaker onMatchInviteSent={() => setActiveTab("overview")} />;
      case "lobbies":
        return <LobbyList onJoinLobby={handleJoinLobby} />;
      case "lobby-room":
        return activeLobbyId ? (
          <LobbyRoom lobbyId={activeLobbyId} onLeaveLobby={handleLeaveLobby} />
        ) : (
          <div className="empty-state glass-panel">
            <Radio size={48} className="pulse-icon" />
            <h3>No Active Lobby</h3>
            <p>Go to Browse Lobbies or Matchmaking to enter a lobby room.</p>
            <button className="glass-btn glass-btn-primary" onClick={() => setActiveTab("lobbies")}>
              Browse Lobbies
            </button>
          </div>
        );
      case "stats":
        return <Stats />;
      case "friends":
        return <Friends onInviteToLobby={handleJoinLobby} activeLobbyId={activeLobbyId} />;
      case "admin":
        return user?.role === "admin" ? <Admin /> : <div className="empty-state">Access Denied</div>;
      case "overview":
      default:
        return (
          <div className="overview-container">
            {matchNotification && (
              <div className="match-banner badge badge-success flex-center pulse-glow-match">
                <Radio size={20} className="spin-icon" />
                <span>Match found! Connecting you to lobby: <strong>{matchNotification.lobby?.name}</strong> (Match score: {matchNotification.compatibilityScore}%)</span>
              </div>
            )}

            <div className="welcome-banner glass-panel">
              <div className="welcome-text">
                <h1>Welcome Back, {user?.username}</h1>
                <p>Status: Synchronized. Ready for matchmaking deployment.</p>
              </div>
              <div className="quick-stats-badge">
                <span className="stats-label">Current ELO</span>
                <span className="stats-value">{playerStats?.currentElo || 1200}</span>
              </div>
            </div>

            {!userProfile ? (
              <div className="profile-prompt glass-panel">
                <AlertTriangle size={32} className="warning-icon" />
                <div>
                  <h3>Profile Calibrations Incomplete</h3>
                  <p>Configure your game and roles to access the automated matchmaking algorithms.</p>
                </div>
                <button className="glass-btn glass-btn-primary" onClick={() => setActiveTab("profile")}>
                  Setup Profile
                </button>
              </div>
            ) : (
              <div className="dashboard-grid">
                <div className="dash-card glass-panel glass-panel-glow" onClick={() => setActiveTab("matchmaker")}>
                  <Radio size={32} className="card-icon blue-glow" />
                  <h3>Find Players</h3>
                  <p>Initiate automated matchmaking search to gather suggested compatible teammates.</p>
                </div>
                
                <div className="dash-card glass-panel glass-panel-glow" onClick={() => setActiveTab("lobbies")}>
                  <Users size={32} className="card-icon purple-glow" />
                  <h3>Browse Lobbies</h3>
                  <p>Search active game lobby rooms or establish your own public lobby.</p>
                </div>

                <div className="dash-card glass-panel glass-panel-glow" onClick={() => setActiveTab("stats")}>
                  <Trophy size={32} className="card-icon gold-glow" />
                  <h3>Statistics</h3>
                  <p>Review match history, win rates, and track your competitive ELO progress.</p>
                </div>

                <div className="dash-card glass-panel glass-panel-glow" onClick={() => setActiveTab("friends")}>
                  <User size={32} className="card-icon emerald-glow" />
                  <h3>Friends Social</h3>
                  <p>Coordinate with team friends, accept pending invitations, and invite friends to lobbies.</p>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <aside className="dashboard-sidebar glass-panel">
        <div className="sidebar-brand">
          <Gamepad2 size={28} className="brand-icon" />
          <span>NEXUS</span>
        </div>

        <div className="sidebar-profile">
          <div className="avatar-wrapper flex-center">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : "G"}
          </div>
          <div className="profile-details">
            <span className="profile-name">{user?.username}</span>
            <span className="profile-role badge badge-primary">{userProfile?.role || "Recruit"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={20} />
            <span>Profile</span>
          </button>

          {userProfile && (
            <>
              <button 
                className={`nav-item ${activeTab === "matchmaker" ? "active" : ""}`}
                onClick={() => setActiveTab("matchmaker")}
              >
                <Radio size={20} />
                <span>Matchmaking</span>
              </button>

              <button 
                className={`nav-item ${activeTab === "lobbies" ? "active" : ""}`}
                onClick={() => setActiveTab("lobbies")}
              >
                <Users size={20} />
                <span>Lobbies</span>
              </button>
            </>
          )}

          <button 
            className={`nav-item ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <Trophy size={20} />
            <span>Statistics</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => setActiveTab("friends")}
          >
            <Users size={20} />
            <span>Friends</span>
          </button>

          {user?.role === "admin" && (
            <button 
              className={`nav-item admin-tab ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              <Shield size={20} />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        <button className="sidebar-logout nav-item" onClick={handleLogoutClick}>
          <LogOut size={20} />
          <span>Disconnect</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {renderContent()}
      </main>

      <style>{`
        .dashboard-layout {
          display: flex;
          width: 100vw;
          min-height: 100vh;
          background-color: var(--bg-primary);
        }

        .dashboard-sidebar {
          width: var(--sidebar-width);
          border-radius: 0;
          border-top: none;
          border-bottom: none;
          border-left: none;
          display: flex;
          flex-direction: column;
          padding: 24px;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 22px;
          letter-spacing: 0.08em;
          color: white;
          margin-bottom: 32px;
        }

        .brand-icon {
          color: var(--accent-purple);
          filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
        }

        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .avatar-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
          color: white;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          overflow: hidden;
        }

        .profile-name {
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 130px;
        }

        .profile-role {
          font-size: 10px;
          padding: 2px 6px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-family);
          font-size: 14px;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          transition: var(--transition-fast);
          text-align: left;
          width: 100%;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: rgba(139, 92, 246, 0.1);
          color: var(--accent-purple);
          border: 1px solid rgba(139, 92, 246, 0.2);
          font-weight: 600;
        }

        .admin-tab:hover {
          color: var(--accent-crimson);
          background: rgba(239, 68, 68, 0.05);
        }

        .admin-tab.active {
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-crimson);
          border-color: rgba(239, 68, 68, 0.2);
        }

        .sidebar-logout {
          margin-top: auto;
          color: var(--text-muted);
        }

        .sidebar-logout:hover {
          color: var(--accent-crimson);
          background: rgba(239, 68, 68, 0.05);
        }

        .dashboard-content {
          flex: 1;
          padding: 40px;
          overflow-y: auto;
          height: 100vh;
        }

        /* Overview Content Styles */
        .overview-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
        }

        .match-banner {
          padding: 16px 20px;
          font-size: 14px;
          border-radius: 12px;
          gap: 12px;
          justify-content: flex-start;
          width: 100%;
        }

        .pulse-glow-match {
          animation: pulseGlow 2s infinite;
        }

        .welcome-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px;
          border-radius: 20px;
          text-align: left;
          background: linear-gradient(135deg, rgba(20, 21, 38, 0.6) 0%, rgba(139, 92, 246, 0.05) 100%);
          border-color: rgba(139, 92, 246, 0.15);
        }

        .welcome-text h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .welcome-text p {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .quick-stats-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 12px 20px;
        }

        .stats-label {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .stats-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--accent-purple);
        }

        .profile-prompt {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          border-radius: 16px;
          text-align: left;
          border-color: rgba(245, 158, 11, 0.2);
          background: rgba(245, 158, 11, 0.02);
        }

        .warning-icon {
          color: var(--accent-gold);
        }

        .profile-prompt h3 {
          margin-bottom: 4px;
        }

        .profile-prompt p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .profile-prompt button {
          margin-left: auto;
          flex-shrink: 0;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .dash-card {
          padding: 28px;
          border-radius: 16px;
          text-align: left;
          cursor: pointer;
        }

        .card-icon {
          margin-bottom: 16px;
        }

        .dash-card h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .dash-card p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        /* Color classes */
        .blue-glow { color: var(--accent-blue); filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.3)); }
        .purple-glow { color: var(--accent-purple); filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.3)); }
        .gold-glow { color: var(--accent-gold); filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.3)); }
        .emerald-glow { color: var(--accent-emerald); filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.3)); }

        .empty-state {
          padding: 60px 40px;
          text-align: center;
          max-width: 500px;
          margin: 100px auto 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .empty-state h3 {
          font-size: 20px;
        }

        .empty-state p {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .pulse-icon {
          color: var(--accent-purple);
          animation: pulseGlow 2s infinite;
        }

        .spin-icon {
          animation: radarSweep 4s linear infinite;
        }

        @media (max-width: 900px) {
          .dashboard-layout {
            flex-direction: column;
          }

          .dashboard-sidebar {
            width: 100%;
            height: auto;
            position: relative;
            border-right: none;
            border-bottom: 1px solid var(--glass-border);
            padding: 16px;
          }

          .sidebar-brand {
            margin-bottom: 16px;
          }

          .sidebar-profile {
            display: none; /* Hide in mobile sidebar header to save space */
          }

          .sidebar-nav {
            flex-direction: row;
            flex-wrap: wrap;
            margin-bottom: 12px;
          }

          .nav-item {
            width: auto;
            flex: 1 1 auto;
            padding: 8px 12px;
            font-size: 12px;
          }

          .sidebar-logout {
            margin-top: 0;
          }

          .dashboard-content {
            padding: 20px;
            height: auto;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
