import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user data
      const userRes = await api.get('/api/users/me');
      const userData = userRes?.data?.data || userRes?.data || {};
      setUser(userData);

      // Fetch recent activities
      const activitiesRes = await api.get('/api/activities');
      const activitiesData = activitiesRes?.data?.data || activitiesRes?.data || [];
      setRecentActivities(Array.isArray(activitiesData) ? activitiesData.slice(0, 5) : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load dashboard';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityType = (type) => {
    if (!type) return '-';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="page-state">Loading dashboard...</div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Welcome{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="dashboard-subtitle">Track your impact and keep the momentum going.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-icon">🌱</div>
          <div className="stat-label">Total Points</div>
          <div className="stat-value stat-positive">
            {(user?.totalPoints || user?.carbonPoints || user?.points || 0).toLocaleString()}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Activities</div>
          <div className="stat-value stat-primary">
            {recentActivities.length}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-label">Current Badge</div>
          <div className="stat-value stat-warm">
            {getBadgeName(user?.totalPoints || user?.carbonPoints || user?.points || 0)}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card section-card">
        <div className="section-header">
          <h2>Quick Actions</h2>
          <span className="section-hint">Jump back in with one click.</span>
        </div>
        <div className="action-row">
          <Link to="/submit-activity" className="action-link action-primary">+ Submit Activity</Link>
          <Link to="/my-activities" className="action-link action-secondary">View My Activities</Link>
          <Link to="/leaderboard" className="action-link action-accent">Leaderboard</Link>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card section-card">
        <div className="section-header">
          <h2>Recent Activities</h2>
          <span className="section-hint">Your latest submissions at a glance.</span>
        </div>
        {recentActivities.length === 0 ? (
          <p className="empty-state">
            No activities yet. <Link to="/submit-activity">Submit your first one!</Link>
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Points</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((activity, idx) => (
                  <tr key={activity.id || idx}>
                    <td>{formatActivityType(activity.activityType)}</td>
                    <td>{activity.quantity ?? activity.declaredQuantity ?? '-'}</td>
                    <td className="table-strong">{activity.carbonPoints || activity.points || 0}</td>
                    <td>
                      <span
                        className={`status-pill ${activity.status === 'APPROVED' ? 'status-approved' : 'status-pending'}`}
                      >
                        {activity.status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const getBadgeName = (points) => {
  if (points > 300) return 'Gold 🥇';
  if (points > 100) return 'Silver 🥈';
  return 'Bronze 🥉';
};

export default Dashboard;
