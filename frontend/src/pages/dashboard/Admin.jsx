import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const STATUS_STYLES = {
  PENDING: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  DECLARED: { bg: '#e0e7ff', color: '#4f46e5', label: 'Declared' },
  PROOF_SUBMITTED: { bg: '#fef3c7', color: '#d97706', label: 'Ready for Review' },
  APPROVED: { bg: '#d1fae5', color: '#059669', label: 'Approved' },
  REJECTED: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' }
};

const Admin = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/activities');
      const data = res?.data?.data || res?.data || [];
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load activities';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (activityId) => {
    setActionLoading(activityId);
    try {
      await api.put(`/admin/activities/approve/${activityId}`);
      setActivities(prev =>
        prev.map(a => a.id === activityId ? { ...a, status: 'APPROVED' } : a)
      );
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to approve';
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (activityId) => {
    const reason = prompt('Enter rejection reason (optional):');
    setActionLoading(activityId);
    try {
      await api.put(`/admin/activities/reject/${activityId}`, { reason: reason || '' });
      setActivities(prev =>
        prev.map(a => a.id === activityId ? { ...a, status: 'REJECTED', rejectionReason: reason } : a)
      );
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reject';
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatActivityType = (type) => {
    if (!type) return '-';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const getProofImageSrc = (proofImage) => {
    if (!proofImage) return null;
    if (proofImage.startsWith('data:') || proofImage.startsWith('http')) {
      return proofImage;
    }
    return `data:image/jpeg;base64,${proofImage}`;
  };

  const getMapLink = (lat, lon) => {
    if (lat == null || lon == null) return null;
    return `https://www.google.com/maps?q=${lat},${lon}`;
  };

  const getStatusStyle = (status) => {
    return STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  };

  const filteredActivities = filter === 'ALL'
    ? activities
    : activities.filter(a => a.status === filter);

  const pendingCount = activities.filter(a => a.status === 'PROOF_SUBMITTED' || a.status === 'PENDING').length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Panel</h1>
        <p className="dashboard-subtitle">Review activity proofs and approve contributions.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="dashboard-grid admin-metrics">
        <div className="card stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value stat-primary">{activities.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value stat-warm">{pendingCount}</div>
        </div>
      </div>

      <div className="admin-filters">
        {['ALL', 'PROOF_SUBMITTED', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`toggle-button ${filter === status ? 'active' : ''}`}
          >
            {status === 'ALL' ? 'All' : STATUS_STYLES[status]?.label || status}
          </button>
        ))}
      </div>

      <div className="card section-card">
        {loading ? (
          <div className="page-state">Loading activities...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="page-state">No activities found.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Points</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="cell-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity, idx) => {
                  const statusStyle = getStatusStyle(activity.status);
                  const isActionLoading = actionLoading === activity.id;
                  const proofSrc = getProofImageSrc(activity.proofImage);
                  const mapLink = getMapLink(activity.latitude, activity.longitude);
                  return (
                    <tr key={activity.id || idx}>
                      <td className="table-muted">#{activity.id}</td>
                      <td>
                        <div className="table-strong">
                          {activity.user?.username || activity.username || 'Unknown'}
                        </div>
                        <div className="table-muted">
                          {activity.user?.email || activity.userEmail || ''}
                        </div>
                      </td>
                      <td>{formatActivityType(activity.activityType || activity.type)}</td>
                      <td>{activity.quantity ?? activity.declaredQuantity ?? '-'}</td>
                      <td className="table-strong">{activity.carbonPoints || activity.points || 0}</td>
                      <td>
                        {formatDate(activity.createdAt || activity.date)}
                        {proofSrc && (
                          <div className="proof-thumb">
                            <img
                              src={proofSrc}
                              alt="Proof"
                              className="proof-thumb-image"
                              onClick={() => setPreview({
                                src: proofSrc,
                                lat: activity.latitude,
                                lon: activity.longitude,
                                mapLink
                              })}
                            />
                            {mapLink && (
                              <div className="table-muted">
                                {activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className="status-pill status-pill--dynamic"
                          style={{ '--status-bg': statusStyle.bg, '--status-color': statusStyle.color }}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="cell-center">
                        {(activity.status === 'PENDING' || activity.status === 'PROOF_SUBMITTED') ? (
                          <div className="admin-actions">
                            <button
                              onClick={() => handleApprove(activity.id)}
                              disabled={isActionLoading}
                              className="btn btn-approve"
                            >
                              {isActionLoading ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(activity.id)}
                              disabled={isActionLoading}
                              className="btn btn-reject"
                            >
                              {isActionLoading ? '...' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className="table-muted">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Proof Preview</h3>
              <button className="modal-close" onClick={() => setPreview(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <img src={preview.src} alt="Proof preview" />
            </div>
            {preview.mapLink && (
              <div className="modal-link">
                <a href={preview.mapLink} target="_blank" rel="noreferrer">
                  View location on Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="section-footer">
        <button
          onClick={fetchActivities}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default Admin;
