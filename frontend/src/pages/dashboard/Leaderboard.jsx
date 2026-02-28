import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const MEDALS = ['🥇', '🥈', '🥉'];

const getPoints = (user) =>
  user?.totalPoints || user?.carbonPoints || user?.points || 0;

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/leaderboard');
      const data = res?.data?.data || res?.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load leaderboard';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="lb-header">
        <div>
          <h1 className="dashboard-title">Leaderboard</h1>
          <p className="dashboard-subtitle">Celebrate the top contributors and stay inspired.</p>
        </div>
        <div className="lb-header-actions">
          <button className="btn btn-secondary" disabled title="Coming soon">
            Analytics
          </button>
          <button
            className="btn btn-primary"
            onClick={fetchLeaderboard}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Main card ─────────────────────────────────────────────── */}
      <div className="card lb-card">
        {loading ? (
          <div className="page-state">Loading leaderboard…</div>
        ) : users.length === 0 ? (
          <div className="page-state">No users on the leaderboard yet.</div>
        ) : (
          <>
            {/* Top-3 podium */}
            {users.length >= 3 && (
              <div className="lb-podium">
                {/* 2nd place */}
                <div className="lb-podium-item lb-podium-second">
                  <span className="lb-podium-medal">🥈</span>
                  <div className="lb-podium-tile">
                    <div className="lb-podium-name">
                      {users[1]?.name || users[1]?.username || 'User'}
                    </div>
                    {users[1]?.email && (
                      <div className="lb-podium-email">{users[1].email}</div>
                    )}
                    <div className="lb-podium-pts">
                      {getPoints(users[1]).toLocaleString()} pts
                    </div>
                  </div>
                </div>

                {/* 1st place */}
                <div className="lb-podium-item lb-podium-first">
                  <span className="lb-podium-medal lb-podium-medal-lg">🥇</span>
                  <div className="lb-podium-tile lb-podium-tile-first">
                    <div className="lb-podium-name lb-podium-name-first">
                      {users[0]?.name || users[0]?.username || 'User'}
                    </div>
                    {users[0]?.email && (
                      <div className="lb-podium-email">{users[0].email}</div>
                    )}
                    <div className="lb-podium-pts lb-podium-pts-first">
                      {getPoints(users[0]).toLocaleString()} pts
                    </div>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="lb-podium-item lb-podium-third">
                  <span className="lb-podium-medal">🥉</span>
                  <div className="lb-podium-tile">
                    <div className="lb-podium-name">
                      {users[2]?.name || users[2]?.username || 'User'}
                    </div>
                    {users[2]?.email && (
                      <div className="lb-podium-email">{users[2].email}</div>
                    )}
                    <div className="lb-podium-pts">
                      {getPoints(users[2]).toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Divider between podium and full table */}
            {users.length >= 3 && <div className="lb-divider" />}

            {/* Full rankings table */}
            <div className="table-wrap">
              <table className="data-table lb-table">
                <thead>
                  <tr>
                    <th className="lb-col-rank">Rank</th>
                    <th className="lb-col-user">User</th>
                    <th className="lb-col-pts">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => {
                    const rank = user.rank || idx + 1;
                    const isTop = rank <= 3;
                    return (
                      <tr
                        key={user.id || user.userId || idx}
                        className={`lb-row${isTop ? ' lb-row-top' : ''}`}
                      >
                        {/* Rank cell */}
                        <td className="lb-col-rank">
                          {isTop ? (
                            <span className="lb-rank-medal">{MEDALS[rank - 1]}</span>
                          ) : (
                            <span className="lb-rank-badge">{rank}</span>
                          )}
                        </td>

                        {/* User cell */}
                        <td className="lb-col-user">
                          <div className={`lb-user-name${isTop ? ' lb-user-name-top' : ''}`}>
                            {user.username || user.name || 'Anonymous'}
                          </div>
                          {user.email && (
                            <div className="lb-user-email">{user.email}</div>
                          )}
                        </td>

                        {/* Points cell */}
                        <td className="lb-col-pts">
                          <span className={`lb-pts-val${isTop ? ' lb-pts-val-top' : ''}`}>
                            {getPoints(user).toLocaleString()}
                          </span>
                          <span className="lb-pts-label"> pts</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
