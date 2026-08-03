import React, { useState, useEffect } from "react";
import api from "../services/api";
import { UserCheck, UserPlus, Users, MessageSquareCode, Check, X, ShieldAlert } from "lucide-react";

export default function Friends({ onInviteToLobby, activeLobbyId }) {
  const [activeSubTab, setActiveSubTab] = useState("list"); // "list", "requests"
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchSuccess, setSearchSuccess] = useState("");
  const [searchError, setSearchError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const loadSocialData = async () => {
    try {
      const list = await api.getFriends();
      setFriends(list);
      
      const reqs = await api.getFriendRequests();
      setRequests(reqs);
    } catch (err) {
      console.error("Failed to load friends list:", err);
    }
  };

  useEffect(() => {
    loadSocialData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSearchSuccess("");
    setSearchError("");
    
    if (!searchName.trim()) return;

    setLoading(true);
    try {
      await api.sendFriendRequest(searchName.trim());
      setSearchSuccess(`Friend transmission request dispatched to ${searchName}!`);
      setSearchName("");
      loadSocialData();
      setTimeout(() => setSearchSuccess(""), 4000);
    } catch (err) {
      setSearchError(err.message || "Failed to dispatch request.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId, accept) => {
    setActioningId(requestId);
    try {
      await api.handleFriendRequest(requestId, accept);
      loadSocialData();
    } catch (err) {
      alert(err.message || "Failed to respond to request.");
    } finally {
      setActioningId(null);
    }
  };

  const handleInviteFriend = (friend) => {
    if (onInviteToLobby && activeLobbyId) {
      alert(`Lobby invitation sent to ${friend.username}!`);
      // In mock, let's pretend they accept and join after a short delay
      setTimeout(() => {
        onInviteToLobby(activeLobbyId);
      }, 1000);
    }
  };

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h2>Friends Social</h2>
        <p className="subtitle">Coordinate with teammates, manage invitations and expand your roster</p>
      </div>

      <div className="friends-tabs-grid">
        {/* Left Column: Form & Tab buttons */}
        <div className="social-controls-panel glass-panel">
          <div className="social-nav-buttons">
            <button 
              className={`social-nav-btn flex-center ${activeSubTab === "list" ? "active" : ""}`}
              onClick={() => setActiveSubTab("list")}
            >
              <Users size={16} />
              <span>Squad List ({friends.length})</span>
            </button>
            <button 
              className={`social-nav-btn flex-center ${activeSubTab === "requests" ? "active" : ""}`}
              onClick={() => setActiveSubTab("requests")}
            >
              <UserCheck size={16} />
              <span>Invitations ({requests.length})</span>
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="add-friend-form">
            <h4>Expand Roster</h4>
            <div className="input-group">
              <input
                type="text"
                className="glass-input"
                placeholder="Enter exact username..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                required
              />
              <button type="submit" className="glass-btn glass-btn-primary flex-center add-submit-btn" disabled={loading}>
                <UserPlus size={16} />
                <span>Add Friend</span>
              </button>
            </div>
            
            {searchSuccess && (
              <div className="social-feedback badge badge-success flex-center">
                <span>{searchSuccess}</span>
              </div>
            )}

            {searchError && (
              <div className="social-feedback badge badge-danger flex-center">
                <ShieldAlert size={14} />
                <span>{searchError}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Dynamic tab content */}
        <div className="social-content-panel glass-panel">
          {activeSubTab === "list" ? (
            <div className="friends-list-view">
              <h3>Squad Friends</h3>
              {friends.length === 0 ? (
                <div className="empty-state-small flex-center">
                  <MessageSquareCode size={36} className="text-muted" />
                  <p>Your roster is currently empty. Use the form to send friend requests.</p>
                </div>
              ) : (
                <div className="roster-grid">
                  {friends.map((friend) => (
                    <div key={friend.id} className="friend-card glass-panel">
                      <div className="avatar-area">
                        <div className="friend-avatar flex-center">
                          {friend.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={`status-dot ${friend.status}`}></span>
                      </div>
                      
                      <div className="friend-details">
                        <h4>{friend.username}</h4>
                        <p className="status-label">
                          {friend.status === "online" ? (
                            friend.game ? `Playing ${friend.game}` : "Online"
                          ) : friend.status === "busy" ? (
                            `In Game (${friend.game})`
                          ) : (
                            "Offline"
                          )}
                        </p>
                      </div>

                      <div className="friend-actions">
                        {activeLobbyId && friend.status === "online" && (
                          <button 
                            className="glass-btn glass-btn-success invite-friend-btn"
                            onClick={() => handleInviteFriend(friend)}
                          >
                            Invite
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="requests-list-view">
              <h3>Incoming Friend Requests</h3>
              {requests.length === 0 ? (
                <div className="empty-state-small flex-center">
                  <UserCheck size={36} className="text-muted" />
                  <p>No pending incoming transmissions received.</p>
                </div>
              ) : (
                <div className="requests-grid">
                  {requests.map((req) => (
                    <div key={req.id} className="request-card glass-panel">
                      <div className="req-avatar flex-center">
                        {req.fromUsername.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="req-details">
                        <h4>{req.fromUsername}</h4>
                        <p className="req-sub">Requests to synchronize contact</p>
                      </div>
                      <div className="req-actions">
                        <button 
                          className="glass-btn glass-btn-success action-circle-btn flex-center"
                          onClick={() => handleRequestResponse(req.id, true)}
                          disabled={actioningId === req.id}
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          className="glass-btn glass-btn-danger action-circle-btn flex-center"
                          onClick={() => handleRequestResponse(req.id, false)}
                          disabled={actioningId === req.id}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .friends-container {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: left;
        }

        .friends-header {
          margin-bottom: 8px;
        }

        .friends-tabs-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 768px) {
          .friends-tabs-grid {
            grid-template-columns: 1fr;
          }
        }

        .social-controls-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .social-nav-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .social-nav-btn {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          color: var(--text-secondary);
          cursor: pointer;
          font-family: var(--font-family);
          font-size: 14px;
          font-weight: 500;
          gap: 10px;
          justify-content: flex-start;
          transition: var(--transition-fast);
        }

        .social-nav-btn:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }

        .social-nav-btn.active {
          background: rgba(139, 92, 246, 0.1);
          color: var(--accent-purple);
          border-color: rgba(139, 92, 246, 0.25);
        }

        .add-friend-form {
          border-top: 1px solid var(--glass-border);
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .add-friend-form h4 {
          font-size: 14px;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .add-friend-form .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .add-submit-btn {
          width: 100%;
        }

        .social-feedback {
          width: 100%;
          padding: 10px;
          font-size: 12px;
          border-radius: 8px;
        }

        /* RIGHT PANEL: SOCIAL CONTENT VIEW */
        .social-content-panel {
          padding: 24px;
          min-height: 400px;
        }

        .social-content-panel h3 {
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 12px;
          margin-bottom: 20px;
        }

        .empty-state-small {
          flex-direction: column;
          gap: 12px;
          padding: 60px 20px;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-state-small p {
          font-size: 13px;
          max-width: 320px;
        }

        .roster-grid, .requests-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .friend-card, .request-card {
          display: flex;
          align-items: center;
          padding: 12px 18px;
          border-radius: 12px;
          gap: 16px;
        }

        .avatar-area {
          position: relative;
        }

        .friend-avatar, .req-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--glass-border);
          font-weight: 700;
          font-size: 13px;
        }

        .status-dot {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--bg-secondary);
          bottom: 0;
          right: 0;
        }

        .status-dot.online { background-color: var(--accent-emerald); }
        .status-dot.busy { background-color: var(--accent-gold); }
        .status-dot.offline { background-color: var(--text-muted); }

        .friend-details, .req-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .friend-details h4, .request-card h4 {
          font-size: 14.5px;
          font-weight: 600;
        }

        .status-label {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .req-sub {
          font-size: 12px;
          color: var(--text-muted);
        }

        .friend-actions {
          flex-shrink: 0;
        }

        .invite-friend-btn {
          padding: 6px 16px;
          font-size: 12px;
        }

        .req-actions {
          display: flex;
          gap: 8px;
        }

        .action-circle-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
