import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Shield, Users, ShieldAlert, CheckCircle, Ban, RefreshCw } from "lucide-react";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banningId, setBanningId] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const uList = await api.getAdminUsers();
      setUsers(uList);
      
      const rList = await api.getAdminReports();
      setReports(rList);
    } catch (err) {
      console.error("Failed to load administrative data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleBanUser = async (userId, username) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to ban and terminate user account "${username}"? This action is permanent.`)) {
      return;
    }

    setBanningId(userId);
    try {
      await api.banUser(userId);
      alert(`User "${username}" has been banned and terminated.`);
      fetchAdminData();
    } catch (err) {
      alert(err.message || "Failed to execute ban request.");
    } finally {
      setBanningId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-state glass-panel flex-center">
        <Shield size={32} className="spin-icon text-crimson" />
        <p>Establishing secure administrative gateway...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-title-badge flex-center">
          <Shield size={20} />
          <span>Security Level: Admin</span>
        </div>
        <h2>Administrative Dashboard</h2>
        <p className="subtitle">Moderate active players, audit reports and enforce code of conduct</p>
      </div>

      {/* Summary grid */}
      <div className="admin-summary-grid">
        <div className="admin-summary-card glass-panel">
          <Users size={24} className="text-blue" />
          <div className="sum-details">
            <span className="sum-val">{users.length}</span>
            <span className="sum-label">Registered Accounts</span>
          </div>
        </div>

        <div className="admin-summary-card glass-panel">
          <ShieldAlert size={24} className="text-crimson" />
          <div className="sum-details">
            <span className="sum-val">{reports.length}</span>
            <span className="sum-label">Active Reports</span>
          </div>
        </div>
      </div>

      <div className="admin-content-grid">
        {/* Reports Tickets */}
        <div className="reports-section glass-panel">
          <div className="section-header">
            <h3>Moderation Reports</h3>
            <button className="glass-btn action-circle-btn flex-center" onClick={fetchAdminData}>
              <RefreshCw size={14} />
            </button>
          </div>
          
          {reports.length === 0 ? (
            <div className="empty-reports flex-center">
              <CheckCircle size={36} className="text-emerald" />
              <p>No active reports in queue. System status normal.</p>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map((rep) => {
                const targetUser = users.find(u => u.username === rep.reported);
                return (
                  <div key={rep.id} className="report-ticket glass-panel">
                    <div className="ticket-header">
                      <span className="badge badge-danger">Ticket {rep.id}</span>
                      <span className="reporter-details">Filed by: {rep.reporter}</span>
                    </div>
                    <div className="ticket-body">
                      <p className="reason-text">"{rep.reason}"</p>
                      <p className="reported-user">Reported Target: <strong>{rep.reported}</strong></p>
                    </div>
                    <div className="ticket-actions">
                      {targetUser ? (
                        <button 
                          className="glass-btn glass-btn-danger flex-center ban-action-btn"
                          onClick={() => handleBanUser(targetUser.id, targetUser.username)}
                          disabled={banningId === targetUser.id}
                        >
                          <Ban size={14} />
                          <span>Ban User</span>
                        </button>
                      ) : (
                        <span className="badge badge-secondary">Target Terminated</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Accounts Directory */}
        <div className="users-section glass-panel">
          <h3>User Directory</h3>
          <div className="user-directory-list">
            {users.map((u) => (
              <div key={u.id} className="user-row glass-panel">
                <div className="user-info">
                  <span className="user-row-name">{u.username}</span>
                  <span className="user-row-email">{u.email}</span>
                </div>
                <div className="user-role-badge">
                  <span className={`badge ${u.role === "admin" ? "badge-danger" : "badge-secondary"}`}>
                    {u.role}
                  </span>
                </div>
                <div className="user-actions">
                  {u.role !== "admin" && (
                    <button 
                      className="glass-btn action-circle-btn flex-center ban-circle-btn"
                      onClick={() => handleBanUser(u.id, u.username)}
                      disabled={banningId === u.id}
                      title="Ban User"
                    >
                      <Ban size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .admin-container {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: left;
        }

        .admin-header {
          margin-bottom: 8px;
        }

        .admin-title-badge {
          display: inline-flex;
          padding: 4px 12px;
          border-radius: 6px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: var(--accent-crimson);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          gap: 6px;
          margin-bottom: 12px;
        }

        .admin-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .admin-summary-card {
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .text-crimson { color: var(--accent-crimson); }
        
        .admin-content-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 768px) {
          .admin-content-grid {
            grid-template-columns: 1fr;
          }
        }

        .reports-section, .users-section {
          padding: 24px;
          min-height: 380px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .reports-section h3, .users-section h3 {
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 12px;
          margin: 0;
        }

        .empty-reports {
          flex-direction: column;
          gap: 16px;
          padding: 60px 20px;
          text-align: center;
          color: var(--text-secondary);
        }

        .empty-reports p {
          font-size: 13px;
        }

        .reports-list, .user-directory-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          max-height: 400px;
          padding-right: 4px;
        }

        .report-ticket {
          padding: 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .reporter-details {
          font-size: 11px;
          color: var(--text-muted);
        }

        .ticket-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .reason-text {
          font-size: 13px;
          font-style: italic;
          color: var(--text-secondary);
        }

        .reported-user {
          font-size: 12px;
        }

        .ban-action-btn {
          font-size: 12px;
          padding: 6px 14px;
          align-self: flex-start;
        }

        /* User rows */
        .user-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          gap: 12px;
        }

        .user-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .user-row-name {
          font-size: 14px;
          font-weight: 600;
        }

        .user-row-email {
          font-size: 11px;
          color: var(--text-muted);
        }

        .user-role-badge .badge {
          font-size: 9px;
          padding: 2px 6px;
        }

        .user-actions {
          display: flex;
          gap: 6px;
        }

        .ban-circle-btn:hover {
          color: var(--accent-crimson) !important;
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.2) !important;
        }
      `}</style>
    </div>
  );
}
