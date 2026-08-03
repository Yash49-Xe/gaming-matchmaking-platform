import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { Users, Plus, X, Globe, Shield, RefreshCw } from "lucide-react";

export default function LobbyList({ onJoinLobby }) {
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Create Lobby Form States
  const [lobbyName, setLobbyName] = useState("");
  const [game, setGame] = useState("Valorant");
  const [region, setRegion] = useState("EU West");
  const [rank, setRank] = useState("Gold");
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const dialogRef = useRef(null);

  const fetchLobbies = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.getLobbies();
      setLobbies(list);
    } catch (err) {
      setError("Failed to fetch lobby list.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
  }, []);

  const handleOpenModal = () => {
    // Reset states
    const profile = api.currentUser;
    setLobbyName(`${profile ? profile.username : "Tactical"}'s Squad`);
    // Open Dialog
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  };

  const handleCloseModal = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const lobby = await api.createLobby({
        name: lobbyName,
        game,
        region,
        rank,
        maxPlayers
      });
      handleCloseModal();
      if (onJoinLobby) onJoinLobby(lobby.id);
    } catch (err) {
      alert(err.message || "Failed to establish lobby.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinClick = (lobby) => {
    if (onJoinLobby) onJoinLobby(lobby.id);
  };

  return (
    <div className="lobby-explorer-container">
      <div className="lobby-explorer-header">
        <div>
          <h2>Public Lobbies</h2>
          <p className="subtitle">Search and connect with active lobbies or establish your own squad</p>
        </div>
        <div className="header-actions">
          <button className="glass-btn flex-center" onClick={fetchLobbies} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
            <span>Sync List</span>
          </button>
          <button className="glass-btn glass-btn-primary flex-center" onClick={handleOpenModal}>
            <Plus size={16} />
            <span>Create Lobby</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="lobby-error badge badge-danger flex-center">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state glass-panel flex-center">
          <RefreshCw size={32} className="spin-icon text-purple" />
          <p>Scanning local gateway for active squads...</p>
        </div>
      ) : lobbies.length === 0 ? (
        <div className="empty-state glass-panel flex-center">
          <Users size={48} className="text-muted" />
          <h3>No Active Lobbies</h3>
          <p>Be the first to establish a deployable lobby for others to join.</p>
          <button className="glass-btn glass-btn-primary" onClick={handleOpenModal}>
            Create New Lobby
          </button>
        </div>
      ) : (
        <div className="lobby-grid">
          {lobbies.map((lobby) => {
            const isFull = lobby.members.length >= lobby.maxPlayers;
            const isLeader = lobby.leaderId === api.currentUser?.id;
            const isAlreadyMember = lobby.members.some(m => m.id === api.currentUser?.id);

            return (
              <div key={lobby.id} className="lobby-card glass-panel glass-panel-glow">
                <div className="lobby-card-header">
                  <span className="badge badge-primary">{lobby.game}</span>
                  <div className="slots-indicator">
                    <Users size={14} />
                    <span>{lobby.members.length} / {lobby.maxPlayers}</span>
                  </div>
                </div>

                <div className="lobby-body">
                  <h3>{lobby.name}</h3>
                  <p className="leader-name">Leader: {lobby.leaderName}</p>
                </div>

                <div className="lobby-specs">
                  <div className="spec-item">
                    <Globe size={14} className="spec-icon" />
                    <span>{lobby.region}</span>
                  </div>
                  <div className="spec-item">
                    <Shield size={14} className="spec-icon" />
                    <span>{lobby.rank}</span>
                  </div>
                </div>

                <div className="lobby-actions">
                  {isLeader || isAlreadyMember ? (
                    <button 
                      className="glass-btn glass-btn-success lobby-join-btn"
                      onClick={() => handleJoinClick(lobby)}
                    >
                      Enter Room
                    </button>
                  ) : isFull ? (
                    <button className="glass-btn lobby-join-btn" disabled>
                      Room Full
                    </button>
                  ) : (
                    <button 
                      className="glass-btn glass-btn-primary lobby-join-btn"
                      onClick={() => handleJoinClick(lobby)}
                    >
                      Join Lobby
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NATIVE MODAL DIALOG */}
      <dialog ref={dialogRef} id="create-lobby-modal" className="create-dialog">
        <div className="modal-content glass-panel">
          <div className="modal-header">
            <h3>Establish Squad Lobby</h3>
            <button className="close-modal-btn flex-center" onClick={handleCloseModal} type="button">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="lobby-name-input">Lobby Callsign</label>
              <input
                id="lobby-name-input"
                type="text"
                className="glass-input"
                placeholder="e.g. Valorant Grind Stack"
                value={lobbyName}
                onChange={(e) => setLobbyName(e.target.value)}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="modal-game-select">Battleground Game</label>
                <select
                  id="modal-game-select"
                  className="glass-input glass-select"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                >
                  <option value="Valorant">Valorant</option>
                  <option value="CS2">CS2</option>
                  <option value="Apex Legends">Apex Legends</option>
                  <option value="Dota 2">Dota 2</option>
                  <option value="League of Legends">League of Legends</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="modal-region-select">Gateway Region</label>
                <select
                  id="modal-region-select"
                  className="glass-input glass-select"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="NA East">NA East</option>
                  <option value="NA West">NA West</option>
                  <option value="EU West">EU West</option>
                  <option value="EU East">EU East</option>
                  <option value="Asia">Asia Pacific</option>
                  <option value="South America">South America</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="modal-rank-select">Rank Restriction</label>
                <select
                  id="modal-rank-select"
                  className="glass-input glass-select"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                >
                  <option value="Bronze">Bronze+</option>
                  <option value="Gold">Gold+</option>
                  <option value="Diamond">Diamond+</option>
                  <option value="Global Elite">Global Elite</option>
                  <option value="Masters">Masters+</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="modal-players-select">Max Members</label>
                <select
                  id="modal-players-select"
                  className="glass-input glass-select"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={5}>5 Players</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="glass-btn cancel-btn" 
                onClick={handleCloseModal}
              >
                Abort
              </button>
              <button 
                type="submit" 
                className="glass-btn glass-btn-primary create-submit-btn"
                disabled={submitting}
              >
                {submitting ? "Deploying..." : "Launch Lobby"}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      <style>{`
        .lobby-explorer-container {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .lobby-explorer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .lobby-error {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
        }

        .lobby-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .lobby-card {
          padding: 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
        }

        .lobby-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .slots-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .lobby-body h3 {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 4px;
        }

        .leader-name {
          font-size: 13px;
          color: var(--text-muted);
        }

        .lobby-specs {
          display: flex;
          gap: 16px;
          border-top: 1px solid var(--glass-border);
          padding-top: 14px;
        }

        .spec-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .spec-icon {
          color: var(--text-muted);
        }

        .lobby-actions {
          margin-top: auto;
        }

        .lobby-join-btn {
          width: 100%;
          padding: 10px;
          font-weight: 600;
        }

        .text-purple {
          color: var(--accent-purple);
        }

        /* Dialog Modal Styles */
        .create-dialog {
          padding: 0;
          background: transparent;
          border: none;
          max-width: 520px;
          width: calc(100% - 32px);
        }

        .modal-content {
          padding: 28px;
          border-radius: 20px;
          background: var(--bg-secondary);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .close-modal-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .close-modal-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .cancel-btn {
          background: transparent;
        }

        .create-submit-btn {
          padding-left: 28px;
          padding-right: 28px;
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .lobby-explorer-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
