import React, { useState } from "react";
import api from "../services/api";
import { Gamepad2, Mail, Lock, User, ShieldAlert } from "lucide-react";

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await api.login(username, password);
      } else {
        await api.register(username, email, password);
      }
      onAuthSuccess();
    } catch (err) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="logo-glow flex-center">
            <Gamepad2 size={40} className="logo-icon" />
          </div>
          <h1>NEXUS</h1>
          <p className="subtitle">Matchmaking & Social Lobby Platform</p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab-btn ${isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${!isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="auth-error badge badge-danger flex-center">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="username-input">
              {isLogin ? "Username or Email" : "Username"}
            </label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="username-input"
                type="text"
                className="glass-input"
                placeholder={isLogin ? "Enter your username/email" : "Choose a unique username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete={isLogin ? "username" : "new-password"}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label htmlFor="email-input">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email-input"
                  type="email"
                  className="glass-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="password-input">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password-input"
                type="password"
                className="glass-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="glass-btn glass-btn-primary auth-submit-btn" 
            disabled={loading}
          >
            {loading ? "Authenticating..." : isLogin ? "Access Station" : "Initialize Profile"}
          </button>
        </form>
      </div>

      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100vw;
          min-height: 100vh;
          background: radial-gradient(circle at center, hsl(230, 25%, 11%) 0%, var(--bg-primary) 100%);
          padding: 24px;
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 40px;
          border-radius: 24px;
          text-align: center;
        }

        .auth-header {
          margin-bottom: 32px;
        }

        .logo-glow {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
          margin: 0 auto 16px;
          box-shadow: 0 0 25px rgba(139, 92, 246, 0.45);
        }

        .logo-icon {
          color: white;
        }

        .auth-header h1 {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 0.1em;
          background: linear-gradient(to right, #fff, var(--text-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 6px;
        }

        .subtitle {
          font-size: 13px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .auth-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .auth-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 14px;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .auth-tab-btn.active {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        .auth-error {
          width: 100%;
          gap: 10px;
          padding: 12px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 24px;
          text-align: left;
        }

        .auth-form {
          text-align: left;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .input-wrapper .glass-input {
          padding-left: 44px;
        }

        .auth-submit-btn {
          width: 100%;
          margin-top: 12px;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
