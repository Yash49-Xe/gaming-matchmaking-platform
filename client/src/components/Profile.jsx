import React, { useState, useEffect } from "react";
import api from "../services/api";
import { User, CheckCircle2, ChevronRight, Award, ShieldAlert } from "lucide-react";

const GAME_METADATA = {
  "Valorant": {
    ranks: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"],
    roles: ["Duelist", "Initiator", "Controller", "Sentinel", "Flex"]
  },
  "CS2": {
    ranks: ["Silver", "Gold Nova", "Master Guardian", "Legendary Eagle", "Supreme Master First Class", "Global Elite"],
    roles: ["Entry Fragger", "AWPer", "IGL (In-Game Leader)", "Lurker", "Support"]
  },
  "Apex Legends": {
    ranks: ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Apex Predator"],
    roles: ["Assault", "Skirmisher", "Recon", "Support", "Controller"]
  },
  "Dota 2": {
    ranks: ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"],
    roles: ["Position 1 - Safe Lane Carry", "Position 2 - Mid Lane", "Position 3 - Offlane", "Position 4 - Soft Support", "Position 5 - Hard Support"]
  },
  "League of Legends": {
    ranks: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"],
    roles: ["Top Lane", "Jungle", "Mid Lane", "Bot Lane Carry", "Support"]
  }
};

export default function Profile({ onSaveSuccess }) {
  const [game, setGame] = useState("Valorant");
  const [rank, setRank] = useState("Gold");
  const [region, setRegion] = useState("EU West");
  const [role, setRole] = useState("Flex");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Sync rank & role options when selected game changes
  useEffect(() => {
    const meta = GAME_METADATA[game];
    if (meta) {
      setRank(meta.ranks[Math.floor(meta.ranks.length / 2)]); // pick middle rank as default
      setRole(meta.roles[0]);
    }
  }, [game]);

  // Load existing profile if any
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.getProfile();
        if (profile) {
          setGame(profile.game);
          // Wait for game state change to trigger options update, then set specific profile details
          setTimeout(() => {
            setRank(profile.rank);
            setRegion(profile.region);
            setRole(profile.role);
          }, 50);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      await api.saveProfile({ game, rank, region, role });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSaveSuccess) onSaveSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card glass-panel">
        <div className="profile-title-bar">
          <div className="title-icon-wrapper flex-center">
            <User size={24} className="title-icon" />
          </div>
          <div>
            <h2>Combat Profile</h2>
            <p className="subtitle">Configure your gaming identity for the matchmaking engine</p>
          </div>
        </div>

        {success && (
          <div className="profile-status badge badge-success flex-center">
            <CheckCircle2 size={16} />
            <span>Profile synchronized successfully!</span>
          </div>
        )}

        {error && (
          <div className="profile-status badge badge-danger flex-center">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="game-select">Primary Battleground</label>
              <select
                id="game-select"
                className="glass-input glass-select"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                required
              >
                {Object.keys(GAME_METADATA).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="region-select">Gateway Region</label>
              <select
                id="region-select"
                className="glass-input glass-select"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
              >
                <option value="NA East">North America (East)</option>
                <option value="NA West">North America (West)</option>
                <option value="EU West">Europe (West)</option>
                <option value="EU East">Europe (East)</option>
                <option value="Asia">Asia Pacific</option>
                <option value="Oceania">Oceania</option>
                <option value="South America">South America</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rank-select">Current Skill Rank</label>
              <select
                id="rank-select"
                className="glass-input glass-select"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                required
              >
                {GAME_METADATA[game]?.ranks.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="role-select">Combat Role Specialization</label>
              <select
                id="role-select"
                className="glass-input glass-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                {GAME_METADATA[game]?.roles.map((ro) => (
                  <option key={ro} value={ro}>{ro}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="info-box glass-panel">
            <Award size={20} className="info-icon" />
            <p>
              Your current profile parameters will determine your base <strong>ELO rating (1200)</strong>. 
              The matchmaking engine will match you with players of close proximity in rank, region, and roles.
            </p>
          </div>

          <button 
            type="submit" 
            className="glass-btn glass-btn-primary submit-profile-btn"
            disabled={loading}
          >
            {loading ? "Syncing Identity..." : "Save and Calibrate"}
            <ChevronRight size={18} />
          </button>
        </form>
      </div>

      <style>{`
        .profile-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 20px;
        }

        .profile-card {
          width: 100%;
          max-width: 640px;
          padding: 32px;
          border-radius: 20px;
        }

        .profile-title-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          text-align: left;
        }

        .title-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .title-icon {
          color: var(--accent-purple);
        }

        .profile-status {
          width: 100%;
          padding: 12px;
          font-size: 13px;
          border-radius: 10px;
          gap: 8px;
          margin-bottom: 24px;
          justify-content: flex-start;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: left;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        @media (max-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-group option {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }

        .info-box {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          background: rgba(139, 92, 246, 0.04);
          border-color: rgba(139, 92, 246, 0.15);
        }

        .info-icon {
          color: var(--accent-purple);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .submit-profile-btn {
          align-self: flex-end;
          padding: 12px 28px;
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .submit-profile-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
