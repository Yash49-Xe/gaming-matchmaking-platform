import React, { useState, useEffect } from "react";
import api from "../services/api";
import socket from "../services/socket";
import { Radio, Users, Compass, MailCheck, Send, CheckCircle } from "lucide-react";

export default function Matchmaker({ onMatchInviteSent }) {
  const [activeMode, setActiveMode] = useState("auto"); // "auto" or "suggested"
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [invitedPlayers, setInvitedPlayers] = useState({}); // mapping playerId -> true

  useEffect(() => {
    let timer;
    if (isSearching) {
      timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(timer);
  }, [isSearching]);

  // Load manual suggestions on tab select
  useEffect(() => {
    if (activeMode === "suggested") {
      fetchSuggestions();
    }
  }, [activeMode]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const list = await api.searchPlayers();
      setSuggestions(list);
    } catch (err) {
      console.error("Failed to load suggested players:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleToggleQueue = () => {
    if (isSearching) {
      socket.leaveQueue(api.currentUser.id);
      setIsSearching(false);
    } else {
      setIsSearching(true);
      const profile = api.currentUser;
      socket.joinQueue(profile.id, profile.elo || 1200, {});
    }
  };

  const handleSendInvite = async (player) => {
    setInvitedPlayers(prev => ({ ...prev, [player.id]: "sending" }));
    
    // Simulate API delay
    setTimeout(() => {
      setInvitedPlayers(prev => ({ ...prev, [player.id]: "success" }));
      setTimeout(() => {
        if (onMatchInviteSent) onMatchInviteSent();
      }, 1200);
    }, 800);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="matchmaker-container">
      <div className="matchmaker-header">
        <h2>Teammate Finder</h2>
        <p className="subtitle">Deploy automated search or select teammates manually</p>
      </div>

      <div className="mode-tabs">
        <button 
          className={`mode-tab-btn ${activeMode === "auto" ? "active" : ""}`}
          onClick={() => { setActiveMode("auto"); if (isSearching) handleToggleQueue(); }}
        >
          <Radio size={18} />
          <span>Automated Matchmaking</span>
        </button>
        <button 
          className={`mode-tab-btn ${activeMode === "suggested" ? "active" : ""}`}
          onClick={() => { setActiveMode("suggested"); }}
        >
          <Users size={18} />
          <span>Suggested Players</span>
        </button>
      </div>

      {activeMode === "auto" ? (
        <div className="queue-panel glass-panel flex-center">
          {isSearching ? (
            <div className="searching-state flex-center">
              <div className="radar-container">
                <div className="radar-line"></div>
                <div className="radar-ripple ripple-1"></div>
                <div className="radar-ripple ripple-2"></div>
                <div className="radar-ripple ripple-3"></div>
                <Radio size={48} className="radar-center-icon" />
              </div>
              
              <div className="queue-status">
                <h3>Searching for Teammates...</h3>
                <p className="queue-timer">Time elapsed: {formatTime(searchTime)}</p>
                <p className="status-note">Matching based on Rank compatibility & Role coverage</p>
              </div>

              <button className="glass-btn glass-btn-danger cancel-queue-btn" onClick={handleToggleQueue}>
                Cancel Dispatch
              </button>
            </div>
          ) : (
            <div className="idle-state flex-center">
              <Compass size={64} className="idle-icon" />
              <h3>Ready for Matchmaking</h3>
              <p>Automated matchmaking connects you directly to compatible players in a dedicated Lobby Room.</p>
              <button className="glass-btn glass-btn-primary start-queue-btn" onClick={handleToggleQueue}>
                Enter Matchmaking Queue
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="suggestions-panel">
          {loadingSuggestions ? (
            <div className="loading-state flex-center glass-panel">
              <Radio size={32} className="spin-icon text-blue" />
              <p>Calibrating compatibility matrix...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="empty-state glass-panel">
              <Users size={48} className="text-muted" />
              <h3>No Suggestions Available</h3>
              <p>Ensure you have configured your gaming profile correctly to see matches.</p>
            </div>
          ) : (
            <div className="suggestions-list">
              {suggestions.map((player) => (
                <div key={player.id} className="player-card glass-panel glass-panel-glow">
                  <div className="player-avatar-wrapper flex-center">
                    {player.username.substring(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="player-details">
                    <div className="player-meta-header">
                      <h4>{player.username}</h4>
                      <span className="player-elo badge badge-primary">{player.elo} ELO</span>
                    </div>
                    
                    <div className="player-badges">
                      <span className="badge badge-secondary">{player.rank}</span>
                      <span className="badge badge-success">{player.role}</span>
                      <span className="badge badge-warning">{player.region}</span>
                    </div>

                    <div className="compatibility-score">
                      <div className="score-label">
                        <span>Compatibility</span>
                        <span className="score-percent">{player.compatibilityScore}%</span>
                      </div>
                      <div className="progress-bar-track">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${player.compatibilityScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="player-actions">
                    {invitedPlayers[player.id] === "success" ? (
                      <button className="glass-btn glass-btn-success invite-btn" disabled>
                        <CheckCircle size={16} />
                        <span>Invited!</span>
                      </button>
                    ) : invitedPlayers[player.id] === "sending" ? (
                      <button className="glass-btn invite-btn" disabled>
                        <span>Transmitting...</span>
                      </button>
                    ) : (
                      <button 
                        className="glass-btn glass-btn-primary invite-btn"
                        onClick={() => handleSendInvite(player)}
                      >
                        <Send size={16} />
                        <span>Send Invite</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .matchmaker-container {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .matchmaker-header {
          text-align: left;
        }

        .mode-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }

        .mode-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 14px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .mode-tab-btn.active {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        .queue-panel {
          min-height: 380px;
          flex-direction: column;
          border-radius: 20px;
          padding: 40px;
          background: radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, var(--glass-bg) 100%);
        }

        .idle-state, .searching-state {
          flex-direction: column;
          gap: 20px;
          text-align: center;
          max-width: 480px;
        }

        .idle-icon {
          color: var(--text-muted);
          animation: pulseGlow 3s infinite;
        }

        .start-queue-btn {
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          margin-top: 10px;
          animation: pulseGlow 2s infinite;
        }

        /* Radar Scanning Visuals */
        .radar-container {
          position: relative;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 1px solid rgba(59, 130, 246, 0.25);
          background: rgba(17, 18, 30, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .radar-line {
          position: absolute;
          width: 50%;
          height: 2px;
          background: linear-gradient(to right, rgba(59, 130, 246, 0), var(--accent-blue));
          top: 50%;
          left: 50%;
          transform-origin: 0% 50%;
          animation: radarSweep 3s linear infinite;
        }

        .radar-center-icon {
          color: var(--accent-blue);
          filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.6));
          z-index: 2;
        }

        .radar-ripple {
          position: absolute;
          border: 1.5px solid rgba(139, 92, 246, 0.2);
          border-radius: 50%;
          width: 100%;
          height: 100%;
          animation: ripples 3s linear infinite;
        }

        .ripple-1 { animation-delay: 0s; }
        .ripple-2 { animation-delay: 1s; }
        .ripple-3 { animation-delay: 2s; }

        .queue-status h3 {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .queue-timer {
          font-size: 24px;
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--accent-blue);
          margin-bottom: 4px;
        }

        .status-note {
          font-size: 13px;
          color: var(--text-muted);
        }

        .cancel-queue-btn {
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
        }

        /* Suggestions Tab Styles */
        .suggestions-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .loading-state {
          flex-direction: column;
          gap: 16px;
          padding: 60px;
        }

        .text-blue {
          color: var(--accent-blue);
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .player-card {
          display: flex;
          align-items: center;
          padding: 20px;
          border-radius: 16px;
          gap: 20px;
          text-align: left;
        }

        .player-avatar-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          color: var(--accent-blue);
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
        }

        .player-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .player-meta-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .player-meta-header h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .player-elo {
          font-size: 10px;
          padding: 2px 8px;
        }

        .player-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .player-badges .badge {
          font-size: 10px;
          padding: 2px 8px;
        }

        .compatibility-score {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 280px;
        }

        .score-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
        }

        .score-percent {
          font-weight: 600;
          color: var(--accent-emerald);
        }

        .progress-bar-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
          width: 100%;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(to right, var(--accent-blue), var(--accent-emerald));
          border-radius: 2px;
        }

        .player-actions {
          flex-shrink: 0;
        }

        .invite-btn {
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          min-width: 130px;
        }

        @media (max-width: 600px) {
          .player-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .player-actions {
            width: 100%;
          }

          .invite-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
