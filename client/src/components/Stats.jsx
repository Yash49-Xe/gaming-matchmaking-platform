import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Trophy, TrendingUp, Percent, Flame, Calendar, Medal } from "lucide-react";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getPlayerStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-state glass-panel flex-center">
        <Trophy size={32} className="spin-icon text-gold" />
        <p>Retrieving combat history records...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state glass-panel">
        <Trophy size={48} className="text-muted" />
        <h3>No Records Found</h3>
        <p>Participate in lobby matches to compile performance analytics.</p>
      </div>
    );
  }

  // Calculate coordinates for the SVG ELO chart
  const renderEloChart = () => {
    const history = stats.eloHistory || [1200, 1200];
    const width = 500;
    const height = 150;
    const padding = 20;

    const minElo = Math.min(...history) - 30;
    const maxElo = Math.max(...history) + 30;
    const eloRange = maxElo - minElo || 1;

    const points = history.map((elo, idx) => {
      const x = padding + (idx * (width - 2 * padding)) / (history.length - 1 || 1);
      const y = height - padding - ((elo - minElo) * (height - 2 * padding)) / eloRange;
      return { x, y, elo };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
      <div className="chart-wrapper glass-panel">
        <h4>ELO Rating Progression</h4>
        <svg viewBox={`0 0 ${width} ${height}`} className="elo-svg-chart">
          {/* Grid lines */}
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          
          {/* Main line */}
          <path d={pathD} fill="none" stroke="url(#chart-grad)" strokeWidth="3" strokeLinecap="round" />
          
          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="chart-node-group">
              <circle cx={p.x} cy={p.y} r="5" fill="var(--accent-purple)" stroke="white" strokeWidth="1.5" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" className="chart-tooltip-text">
                {p.elo}
              </text>
            </g>
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="chart-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-blue)" />
              <stop offset="100%" stopColor="var(--accent-purple)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2>Combat Performance</h2>
        <p className="subtitle">Operational statistics and ELO tier evaluations</p>
      </div>

      {/* Grid summary cards */}
      <div className="stats-summary-grid">
        <div className="summary-card glass-panel">
          <Medal size={24} className="sum-icon text-blue" />
          <div className="sum-details">
            <span className="sum-val">{stats.currentElo}</span>
            <span className="sum-label">Combat ELO</span>
          </div>
        </div>

        <div className="summary-card glass-panel">
          <Trophy size={24} className="sum-icon text-purple" />
          <div className="sum-details">
            <span className="sum-val">{stats.gamesPlayed}</span>
            <span className="sum-label">Matches Completed</span>
          </div>
        </div>

        <div className="summary-card glass-panel">
          <Percent size={24} className="sum-icon text-emerald" />
          <div className="sum-details">
            <span className="sum-val">{stats.winRate}%</span>
            <span className="sum-label">Win Ratio</span>
          </div>
        </div>

        <div className="summary-card glass-panel">
          <Flame size={24} className="sum-icon text-gold" />
          <div className="sum-details">
            <span className="sum-val">{stats.winStreak}</span>
            <span className="sum-label">Win Streak</span>
          </div>
        </div>
      </div>

      {/* SVG Progression Chart */}
      {renderEloChart()}

      {/* Match History Table */}
      <div className="history-table-wrapper glass-panel">
        <h4>Battle log history</h4>
        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Result</th>
                <th>Score</th>
                <th>ELO Delta</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.history.map((match) => (
                <tr key={match.id}>
                  <td className="bold-cell">{match.game}</td>
                  <td>
                    <span className={`badge ${match.result === "Win" ? "badge-success" : "badge-danger"}`}>
                      {match.result}
                    </span>
                  </td>
                  <td className="mono-cell">{match.score}</td>
                  <td className={`mono-cell ${match.eloChange >= 0 ? "text-win" : "text-loss"}`}>
                    {match.eloChange >= 0 ? `+${match.eloChange}` : match.eloChange}
                  </td>
                  <td className="date-cell flex-center">
                    <Calendar size={12} />
                    <span>{match.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .stats-container {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: left;
        }

        .stats-header {
          margin-bottom: 8px;
        }

        .stats-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        @media (max-width: 768px) {
          .stats-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .stats-summary-grid {
            grid-template-columns: 1fr;
          }
        }

        .summary-card {
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sum-icon {
          padding: 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
        }

        .text-gold { color: var(--accent-gold); }
        .text-purple { color: var(--accent-purple); }
        .text-blue { color: var(--accent-blue); }
        .text-emerald { color: var(--accent-emerald); }

        .sum-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .sum-val {
          font-size: 22px;
          font-weight: 700;
          line-height: 1.1;
        }

        .sum-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* SVG Progression Chart styling */
        .chart-wrapper {
          padding: 24px;
          border-radius: 16px;
        }

        .chart-wrapper h4, .history-table-wrapper h4 {
          font-size: 15px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 20px;
          letter-spacing: 0.05em;
        }

        .elo-svg-chart {
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .chart-node-group circle {
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .chart-node-group:hover circle {
          r: 7px;
          fill: var(--accent-blue);
        }

        .chart-tooltip-text {
          font-size: 10px;
          font-weight: 600;
          fill: var(--text-primary);
          opacity: 0;
          transition: var(--transition-fast);
          pointer-events: none;
        }

        .chart-node-group:hover .chart-tooltip-text {
          opacity: 1;
        }

        /* Match History Table styling */
        .history-table-wrapper {
          padding: 24px;
          border-radius: 16px;
        }

        .table-container {
          overflow-x: auto;
          width: 100%;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .history-table th {
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
          padding: 12px 16px;
          border-bottom: 1px solid var(--glass-border);
        }

        .history-table td {
          font-size: 14px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
        }

        .history-table tr:last-child td {
          border-bottom: none;
        }

        .bold-cell {
          font-weight: 600;
          color: var(--text-primary) !important;
        }

        .mono-cell {
          font-family: var(--font-mono);
          font-size: 13px !important;
        }

        .text-win {
          color: var(--accent-emerald) !important;
          font-weight: 600;
        }

        .text-loss {
          color: var(--accent-crimson) !important;
          font-weight: 600;
        }

        .date-cell {
          justify-content: flex-start;
          gap: 6px;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );
}
