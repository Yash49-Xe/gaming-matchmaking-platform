import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import socket from "../services/socket";
import { Send, LogOut, Check, MessageSquare, ShieldAlert, Award } from "lucide-react";

export default function LobbyRoom({ lobbyId, onLeaveLobby }) {
  const [lobby, setLobby] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  
  const chatEndRef = useRef(null);
  const userId = api.currentUser?.id;

  useEffect(() => {
    // 1. Join real-time socket room
    socket.joinLobby(lobbyId, userId);

    // 2. Register socket update callbacks
    socket.on("lobbyUpdate", (updatedLobby) => {
      setLobby(updatedLobby);
      // Sync local ready state in case it changed externally
      const self = updatedLobby.members.find(m => m.id === userId);
      if (self) {
        setIsReady(self.isReady);
      }
    });

    socket.on("chatMessage", (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });

    socket.on("matchStarted", (data) => {
      // Lobby state updates to "in-progress" automatically via lobbyUpdate
      console.log("Match has started!", data);
    });

    // 3. Load initial lobby details
    const loadDetails = async () => {
      try {
        const details = await api.getLobbyDetails(lobbyId);
        setLobby(details);
        const self = details.members.find(m => m.id === userId);
        if (self) setIsReady(self.isReady);
      } catch (err) {
        console.error("Failed to load lobby details:", err);
      }
    };
    loadDetails();

    // 4. Cleanup on exit
    return () => {
      socket.leaveLobby(lobbyId, userId);
    };
  }, [lobbyId, userId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !lobby) return;
    
    socket.sendMessage(lobbyId, api.currentUser.username, inputText.trim());
    setInputText("");
  };

  const handleToggleReady = () => {
    const nextReady = !isReady;
    setIsReady(nextReady);
    socket.toggleReady(lobbyId, userId, nextReady);
  };

  const handleLeave = () => {
    if (window.confirm("Are you sure you want to abandon the lobby room?")) {
      if (onLeaveLobby) onLeaveLobby();
    }
  };

  const handleSubmitOutcome = async (result) => {
    if (!window.confirm(`Are you sure you want to submit a match outcome of: ${result}?`)) {
      return;
    }
    
    setSubmittingResult(true);
    try {
      await api.submitMatchResult(lobbyId, result);
      alert(`Match result logged: ${result}. Calibration metrics updated.`);
      if (onLeaveLobby) onLeaveLobby();
    } catch (err) {
      alert(err.message || "Failed to submit match outcome.");
    } finally {
      setSubmittingResult(false);
    }
  };

  if (!lobby) {
    return (
      <div className="loading-state glass-panel flex-center">
        <div className="spin-icon">🔌</div>
        <p>Loading Lobby Room protocols...</p>
      </div>
    );
  }

  const isLeader = lobby.leaderId === userId;
  const matchInProgress = lobby.status === "in-progress";

  return (
    <div className="lobby-room-grid">
      {/* LEFT COLUMN: Lobby Info & Members */}
      <div className="lobby-info-panel glass-panel">
        <div className="lobby-room-header">
          <div>
            <span className="badge badge-primary">{lobby.game}</span>
            <h2>{lobby.name}</h2>
            <p className="room-meta">Region: {lobby.region} | Required Rank: {lobby.rank}</p>
          </div>
          <button className="glass-btn glass-btn-danger leave-room-btn flex-center" onClick={handleLeave}>
            <LogOut size={16} />
            <span>Abandon</span>
          </button>
        </div>

        <div className="members-section">
          <h3>Squad Members ({lobby.members.length} / {lobby.maxPlayers})</h3>
          <div className="members-list">
            {lobby.members.map((member) => (
              <div key={member.id} className="member-row glass-panel">
                <div className="member-avatar flex-center">
                  {member.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="member-details">
                  <span className="member-name">
                    {member.username} 
                    {member.id === lobby.leaderId && <span className="leader-crown"> 👑</span>}
                  </span>
                  <span className="member-role badge badge-secondary">{member.role}</span>
                </div>
                <div className="member-status">
                  {member.isReady ? (
                    <div className="status-ready badge badge-success flex-center">
                      <Check size={12} />
                      <span>Ready</span>
                    </div>
                  ) : (
                    <div className="status-unready badge flex-center">
                      <span>Preparing</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className="room-controls">
          {matchInProgress ? (
            <div className="match-control-box glass-panel flex-center">
              <Award size={32} className="gold-glow" />
              <h3>Match is In Progress!</h3>
              <p>Play out the game. The lobby leader must report the victory or defeat below.</p>
              
              {isLeader ? (
                <div className="outcome-buttons">
                  <button 
                    className="glass-btn glass-btn-success"
                    onClick={() => handleSubmitOutcome("Win")}
                    disabled={submittingResult}
                  >
                    Log Victory (Win)
                  </button>
                  <button 
                    className="glass-btn glass-btn-danger"
                    onClick={() => handleSubmitOutcome("Loss")}
                    disabled={submittingResult}
                  >
                    Log Defeat (Loss)
                  </button>
                </div>
              ) : (
                <p className="waiting-leader-note">Waiting for Leader to submit match outcome...</p>
              )}
            </div>
          ) : (
            <button 
              className={`glass-btn ready-toggle-btn ${isReady ? "glass-btn-success" : "glass-btn-primary"}`}
              onClick={handleToggleReady}
            >
              {isReady ? "Ready (Click to Prepare)" : "Mark Ready"}
            </button>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Chat Panel */}
      <div className="lobby-chat-panel glass-panel">
        <div className="chat-header">
          <MessageSquare size={18} className="chat-header-icon" />
          <h3>Combat Communication</h3>
        </div>

        <div className="chat-messages-container">
          {messages.map((msg) => {
            const isSystem = msg.sender === "System";
            const isSelf = msg.sender === api.currentUser?.username;
            
            return (
              <div 
                key={msg.id} 
                className={`chat-bubble-wrapper ${isSystem ? "system" : isSelf ? "self" : ""}`}
              >
                {!isSystem && <span className="chat-sender">{msg.sender}</span>}
                <div className="chat-bubble">
                  <p>{msg.text}</p>
                  <span className="chat-time">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
        </div>

        <form onSubmit={handleSendChat} className="chat-input-bar">
          <input
            type="text"
            className="glass-input"
            placeholder="Transmit message to squad..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            required
            autoComplete="off"
          />
          <button type="submit" className="glass-btn glass-btn-primary chat-send-btn flex-center">
            <Send size={16} />
          </button>
        </form>
      </div>

      <style>{`
        .lobby-room-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          height: calc(100vh - 80px);
          max-width: 1000px;
          margin: 0 auto;
        }

        .lobby-info-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
          height: 100%;
          overflow-y: auto;
        }

        .lobby-room-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 16px;
        }

        .room-meta {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .leave-room-btn {
          padding: 8px 16px;
          font-size: 13px;
        }

        .members-section h3 {
          font-size: 16px;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .members-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .member-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          gap: 16px;
        }

        .member-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--glass-border);
          font-weight: 700;
          font-size: 12px;
        }

        .member-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .member-name {
          font-size: 14px;
          font-weight: 600;
        }

        .leader-crown {
          color: var(--accent-gold);
        }

        .member-role {
          font-size: 9px;
          padding: 1px 6px;
        }

        .member-status .badge {
          font-size: 10px;
          padding: 3px 10px;
        }

        .room-controls {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
        }

        .ready-toggle-btn {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
        }

        .match-control-box {
          flex-direction: column;
          padding: 20px;
          text-align: center;
          gap: 12px;
          background: rgba(245, 158, 11, 0.02);
          border-color: rgba(245, 158, 11, 0.15);
        }

        .outcome-buttons {
          display: flex;
          gap: 12px;
          width: 100%;
          margin-top: 8px;
        }

        .outcome-buttons button {
          flex: 1;
          padding: 12px;
        }

        .waiting-leader-note {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }

        /* CHAT COLUMN PANELS */
        .lobby-chat-panel {
          padding: 20px;
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(17, 18, 30, 0.55);
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 14px;
          text-align: left;
        }

        .chat-header h3 {
          font-size: 15px;
          font-weight: 600;
        }

        .chat-header-icon {
          color: var(--accent-purple);
        }

        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .chat-bubble-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 85%;
        }

        .chat-sender {
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 4px;
          margin-left: 4px;
        }

        .chat-bubble {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--glass-border);
          border-radius: 4px 14px 14px 14px;
          padding: 10px 14px;
          text-align: left;
          word-break: break-word;
        }

        .chat-bubble p {
          font-size: 13.5px;
          color: var(--text-primary);
        }

        .chat-time {
          display: block;
          font-size: 9px;
          color: var(--text-muted);
          text-align: right;
          margin-top: 4px;
        }

        /* Self alignment */
        .chat-bubble-wrapper.self {
          align-self: flex-end;
          align-items: flex-end;
        }

        .chat-bubble-wrapper.self .chat-bubble {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
          border-color: rgba(139, 92, 246, 0.25);
          border-radius: 14px 14px 4px 14px;
        }

        /* System Messages styling */
        .chat-bubble-wrapper.system {
          align-self: center;
          max-width: 100%;
          text-align: center;
        }

        .chat-bubble-wrapper.system .chat-bubble {
          background: transparent;
          border: none;
          padding: 4px;
        }

        .chat-bubble-wrapper.system p {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }

        .chat-bubble-wrapper.system .chat-time {
          display: none;
        }

        .chat-input-bar {
          display: flex;
          gap: 8px;
          border-top: 1px solid var(--glass-border);
          padding-top: 14px;
        }

        .chat-send-btn {
          width: 44px;
          height: 44px;
          padding: 0;
          flex-shrink: 0;
          border-radius: 10px;
        }

        @media (max-width: 768px) {
          .lobby-room-grid {
            grid-template-columns: 1fr;
            height: auto;
          }

          .lobby-info-panel, .lobby-chat-panel {
            height: 450px;
          }
        }
      `}</style>
    </div>
  );
}
