import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../api/axios';

const STATUS_STYLES = {
  DECLARED:        { bg: '#e0e7ff', color: '#4f46e5', label: 'Declared' },
  PROOF_SUBMITTED: { bg: '#fef3c7', color: '#d97706', label: 'Under Review' },
  PENDING:         { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  GPS_VALID:       { bg: '#dbeafe', color: '#2563eb', label: 'GPS Valid' },
  JOURNEY_STARTED: { bg: '#ede9fe', color: '#7c3aed', label: 'Journey Started' },
  APPROVED:        { bg: '#d1fae5', color: '#059669', label: 'Approved' },
  REJECTED:        { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
  VERIFIED:        { bg: '#dbeafe', color: '#2563eb', label: 'Verified' },
  FLAGGED:         { bg: '#ffe4e6', color: '#be123c', label: 'Flagged' },
};

const CATEGORY_OPTIONS = [
  { value: 'ALL',            label: 'All Types',         icon: '📋' },
  { value: 'TREE_PLANTATION',label: 'Tree Plantation',   icon: '🌳' },
  { value: 'PUBLIC_TRANSPORT',label:'Public Transport',  icon: '🚌' },
  { value: 'RECYCLING',      label: 'Recycling',         icon: '♻️' },
];

const STATUS_OPTIONS = [
  { value: 'ALL',            label: 'All Statuses' },
  { value: 'DECLARED',       label: 'Declared' },
  { value: 'PENDING',        label: 'Pending' },
  { value: 'PROOF_SUBMITTED',label: 'Under Review' },
  { value: 'APPROVED',       label: 'Approved' },
  { value: 'REJECTED',       label: 'Rejected' },
  { value: 'FLAGGED',        label: 'Flagged' },
];

// Activities with these statuses can be deleted by the user
const DELETABLE_STATUSES = new Set(['DECLARED', 'PENDING']);

const PAGE_SIZE = 20;

// Helpers
const fmt = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const fmtType = (type) => {
  if (!type) return '-';
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const getIcon = (type) => {
  const t = (type || '').toUpperCase().replace(/ /g, '_');
  if (t.includes('TREE'))      return '🌳';
  if (t.includes('TRANSPORT')) return '🚌';
  if (t.includes('RECYCLING')) return '♻️';
  return '🌱';
};

const normalize = (str) => (str || '').toUpperCase().replace(/ /g, '_');

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
const MyActivities = () => {
  const [activities, setActivities]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  const [textQuery, setTextQuery]         = useState('');
  const [catFilter, setCatFilter]         = useState('ALL');
  const [statusFilter, setStatusFilter]   = useState('ALL');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [qtyMin, setQtyMin]               = useState('');
  const [qtyMax, setQtyMax]               = useState('');

  const [page, setPage]                   = useState(1);
  const [selected, setSelected]           = useState(new Set());
  const [deleteModal, setDeleteModal]     = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast]                 = useState(null);

  const toastTimer = useRef(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchActivities = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/activities');
      const data = res?.data?.data || res?.data || [];
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
      setActivities(arr);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  useEffect(() => { setPage(1); setSelected(new Set()); },
    [textQuery, catFilter, statusFilter, dateFrom, dateTo, qtyMin, qtyMax]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return activities.filter(a => {
      const type = normalize(a.activityType || a.type);
      if (catFilter !== 'ALL' && !type.includes(catFilter)) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (dateFrom) {
        if (new Date(a.createdAt || a.date || 0) < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const end = new Date(dateTo); end.setHours(23, 59, 59);
        if (new Date(a.createdAt || a.date || 0) > end) return false;
      }
      const qty = a.declaredQuantity ?? a.quantity ?? 0;
      if (qtyMin !== '' && qty < Number(qtyMin)) return false;
      if (qtyMax !== '' && qty > Number(qtyMax)) return false;
      if (textQuery.trim()) {
        const q = textQuery.trim().toLowerCase();
        const label   = fmtType(a.activityType || a.type).toLowerCase();
        const typeKey = type.toLowerCase();
        if (!label.includes(q) && !typeKey.includes(q)) return false;
      }
      return true;
    });
  }, [activities, catFilter, statusFilter, dateFrom, dateTo, qtyMin, qtyMax, textQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageEligible = pageItems.filter(a => DELETABLE_STATUSES.has(a.status));
  const allPageEligibleSelected =
    pageEligible.length > 0 && pageEligible.every(a => selected.has(a.id));

  const toggleOne = (id) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSelectAllPage = () => {
    if (allPageEligibleSelected) {
      setSelected(prev => { const n = new Set(prev); pageEligible.forEach(a => n.delete(a.id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); pageEligible.forEach(a => n.add(a.id)); return n; });
    }
  };

  const validSelected = useMemo(() => {
    const ids = new Set(filtered.map(a => a.id));
    return new Set([...selected].filter(id => ids.has(id)));
  }, [selected, filtered]);

  const selectedCount = validSelected.size;

  const confirmSingleDelete = async () => {
    if (deleteModal === null || deleteModal === 'bulk') return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/activities/${deleteModal}`);
      setActivities(prev => prev.filter(a => a.id !== deleteModal));
      setSelected(prev => { const n = new Set(prev); n.delete(deleteModal); return n; });
      setDeleteModal(null);
      showToast('Activity deleted successfully.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Delete failed.', 'error');
      setDeleteModal(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (deleteModal !== 'bulk') return;
    const ids = [...validSelected];
    if (!ids.length) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete('/api/activities/bulk', { data: { ids } });
      const deletedCount = res?.data?.data?.deleted ?? ids.length;
      setActivities(prev => prev.filter(a => !ids.includes(a.id)));
      setSelected(new Set());
      setDeleteModal(null);
      showToast(`${deletedCount} activit${deletedCount === 1 ? 'y' : 'ies'} deleted successfully.`);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Bulk delete failed.', 'error');
      setDeleteModal(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setTextQuery(''); setCatFilter('ALL'); setStatusFilter('ALL');
    setDateFrom(''); setDateTo(''); setQtyMin(''); setQtyMax('');
  };

  const hasFilter = textQuery || catFilter !== 'ALL' || statusFilter !== 'ALL' ||
    dateFrom || dateTo || qtyMin || qtyMax;

  return (
    <div className="dashboard-page">
      <style>{`
        .ma-toast {
          position: fixed; top: 1.25rem; right: 1.25rem;
          padding: 0.85rem 1.5rem; border-radius: 12px;
          font-weight: 700; font-size: 0.9rem; z-index: 2000;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
          animation: maSlideIn 0.25s ease;
        }
        .ma-toast.success { background: #d1fae5; color: #065f46; border: 1.5px solid #6ee7b7; }
        .ma-toast.error   { background: #fee2e2; color: #991b1b; border: 1.5px solid #fca5a5; }
        @keyframes maSlideIn { from { transform: translateX(2rem); opacity:0; } to { transform:none; opacity:1; } }

        .ma-search-panel {
          background: #fff; border-radius: 16px;
          border: 1.5px solid #e2eeec; padding: 1.25rem 1.5rem;
          margin-bottom: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .ma-search-panel-title {
          font-size: 0.72rem; font-weight: 700; color: #aaa;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.875rem;
        }
        .ma-search-top { display: flex; gap: 0.75rem; margin-bottom: 0.875rem; align-items: center; }
        .ma-text-input {
          flex: 1; padding: 0.65rem 1rem;
          border: 1.5px solid #e2eeec; border-radius: 10px;
          font-size: 0.9rem; font-weight: 600; outline: none;
          font-family: inherit; transition: border-color 0.2s; color: #1a1a1a;
        }
        .ma-text-input:focus { border-color: #2a9d8f; }
        .ma-text-input::placeholder { color: #bbb; font-weight: 500; }
        .ma-clear-btn {
          padding: 0.65rem 1.1rem; border-radius: 10px;
          background: #f0f4f3; color: #666; border: 1.5px solid #e2eeec;
          font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .ma-clear-btn:hover { background: #e2eeec; color: #333; }
        .ma-filters-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 0.875rem;
        }
        .ma-filter-group label {
          display: block; font-size: 0.72rem; font-weight: 700;
          color: #888; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem;
        }
        .ma-filter-select, .ma-filter-date, .ma-filter-num {
          width: 100%; padding: 0.55rem 0.8rem;
          border: 1.5px solid #e2eeec; border-radius: 9px;
          font-size: 0.875rem; font-weight: 600; color: #1a1a1a;
          background: #f8fffe; outline: none; font-family: inherit;
          transition: border-color 0.2s; cursor: pointer; box-sizing: border-box;
        }
        .ma-filter-select:focus,.ma-filter-date:focus,.ma-filter-num:focus { border-color: #2a9d8f; }

        .ma-summary-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;
        }
        .ma-summary-left { font-size: 0.88rem; font-weight: 700; color: #444; }
        .ma-summary-left span { color: #2a9d8f; }

        .ma-bulk-bar {
          display: flex; align-items: center; gap: 0.75rem;
          background: #fff3cd; border: 1.5px solid #fde68a;
          border-radius: 12px; padding: 0.75rem 1.25rem;
          margin-bottom: 1rem; flex-wrap: wrap;
        }
        .ma-bulk-count { font-weight: 800; font-size: 0.9rem; color: #92400e; flex: 1; }
        .btn-bulk-delete {
          padding: 0.55rem 1.25rem; border-radius: 9px;
          background: #dc2626; color: #fff; border: none;
          font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
        }
        .btn-bulk-delete:hover:not(:disabled) { background: #b91c1c; transform: translateY(-1px); }
        .btn-bulk-delete:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-clear-sel {
          padding: 0.55rem 1rem; border-radius: 9px;
          background: #f0f4f3; color: #666; border: 1.5px solid #e2eeec;
          font-weight: 700; font-size: 0.85rem; cursor: pointer;
        }
        .btn-clear-sel:hover { background: #e2eeec; }

        .ma-select-all-row {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.6rem 1rem; background: #f8fffe;
          border: 1.5px solid #e2eeec; border-radius: 10px;
          margin-bottom: 0.75rem; font-size: 0.85rem; font-weight: 700; color: #555;
          cursor: pointer; user-select: none;
        }
        .ma-select-all-row:hover { border-color: #2a9d8f; color: #2a9d8f; }
        .ma-select-all-row input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; accent-color: #2a9d8f; }

        .ma-card {
          display: flex; align-items: center; gap: 0.75rem;
          background: #fff; border-radius: 14px;
          border: 1.5px solid #e2eeec; padding: 1rem 1.25rem;
          margin-bottom: 0.75rem;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05); transition: box-shadow 0.2s, border-color 0.2s;
        }
        .ma-card:hover { box-shadow: 0 3px 14px rgba(0,0,0,0.09); }
        .ma-card.selected { border-color: #2a9d8f; background: #f0fdfb; box-shadow: 0 0 0 3px rgba(42,157,143,0.12); }
        .ma-card-check { width: 18px; height: 18px; cursor: pointer; accent-color: #2a9d8f; flex-shrink: 0; }
        .ma-card-icon { font-size: 1.75rem; flex-shrink: 0; }
        .ma-card-body { flex: 1; min-width: 0; }
        .ma-card-title { font-weight: 800; color: #1a1a1a; font-size: 0.95rem; margin-bottom: 0.2rem; }
        .ma-card-meta { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.82rem; color: #888; }
        .ma-card-meta span { font-weight: 600; }
        .ma-card-meta .pts { color: #2a9d8f; }
        .ma-card-right { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
        .ma-status-pill { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .btn-delete-single {
          padding: 0.35rem 0.7rem; border-radius: 7px;
          background: #fff0f0; color: #dc2626;
          border: 1.5px solid #fecaca; font-size: 0.8rem;
          cursor: pointer; transition: all 0.2s; line-height: 1;
        }
        .btn-delete-single:hover { background: #fee2e2; border-color: #dc2626; }
        .ma-protected-note {
          font-size: 0.72rem; color: #aaa; font-weight: 600;
          background: #f8f8f8; padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid #eee;
        }

        .ma-pagination { display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-top: 1.25rem; flex-wrap: wrap; }
        .ma-page-btn {
          padding: 0.45rem 0.9rem; border-radius: 8px;
          border: 1.5px solid #e2eeec; background: #fff;
          font-size: 0.85rem; font-weight: 700; cursor: pointer; color: #444; transition: all 0.2s;
        }
        .ma-page-btn:hover:not(:disabled) { border-color: #2a9d8f; color: #2a9d8f; }
        .ma-page-btn.active { background: #2a9d8f; color: #fff; border-color: #2a9d8f; }
        .ma-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .ma-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
        }
        .ma-modal {
          background: #fff; border-radius: 16px; max-width: 440px; width: 100%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25); overflow: hidden;
        }
        .ma-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.25rem; border-bottom: 1px solid #e2eeec;
        }
        .ma-modal-header h3 { font-weight: 800; color: #1a1a1a; font-size: 1rem; }
        .ma-modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #888; }
        .ma-modal-body { padding: 1.25rem; color: #333; font-size: 0.9rem; line-height: 1.6; }
        .ma-modal-footer {
          display: flex; gap: 0.75rem; justify-content: flex-end;
          padding: 0.875rem 1.25rem; border-top: 1px solid #e2eeec;
        }
        .btn-cancel-modal { padding: 0.6rem 1.25rem; border-radius: 9px; background: #f0f4f3; color: #555; border: none; font-weight: 700; cursor: pointer; }
        .btn-confirm-delete { padding: 0.6rem 1.4rem; border-radius: 9px; background: #dc2626; color: #fff; border: none; font-weight: 800; cursor: pointer; transition: background 0.2s; }
        .btn-confirm-delete:hover:not(:disabled) { background: #b91c1c; }
        .btn-confirm-delete:disabled { opacity: 0.6; cursor: not-allowed; }

        .ma-empty {
          background: #fff; border-radius: 16px; border: 1.5px solid #e2eeec;
          padding: 2.5rem 2rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .ma-empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .ma-empty-title { font-weight: 800; color: #1a1a1a; margin-bottom: 0.3rem; }
        .ma-empty-sub { font-size: 0.85rem; color: #888; }
      `}</style>

      {/* TOAST */}
      {toast && <div className={`ma-toast ${toast.type}`}>{toast.msg}</div>}

      {/* HEADER */}
      <div className="dashboard-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <h1 className="dashboard-title">My Activities</h1>
          <p className="dashboard-subtitle">Track, search, and manage your submissions.</p>
        </div>
        <button onClick={fetchActivities} disabled={loading} className="btn btn-primary" style={{ alignSelf:'flex-start', marginTop:'0.25rem' }}>
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* SEARCH PANEL */}
      <div className="ma-search-panel">
        <div className="ma-search-panel-title">🔍 Search &amp; Filter</div>
        <div className="ma-search-top">
          <input
            className="ma-text-input"
            type="text"
            placeholder="Search by activity type (e.g. Recycling, Tree Plantation…)"
            value={textQuery}
            onChange={e => setTextQuery(e.target.value)}
          />
          {hasFilter && <button className="ma-clear-btn" onClick={clearFilters}>✕ Clear</button>}
        </div>
        <div className="ma-filters-grid">
          <div className="ma-filter-group">
            <label>Activity Type</label>
            <select className="ma-filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div className="ma-filter-group">
            <label>Status</label>
            <select className="ma-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="ma-filter-group">
            <label>Date From</label>
            <input type="date" className="ma-filter-date" value={dateFrom} max={dateTo||undefined} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="ma-filter-group">
            <label>Date To</label>
            <input type="date" className="ma-filter-date" value={dateTo} min={dateFrom||undefined} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="ma-filter-group">
            <label>Qty Min</label>
            <input type="number" min="0" className="ma-filter-num" placeholder="e.g. 5" value={qtyMin} onChange={e => setQtyMin(e.target.value)} />
          </div>
          <div className="ma-filter-group">
            <label>Qty Max</label>
            <input type="number" min="0" className="ma-filter-num" placeholder="e.g. 100" value={qtyMax} onChange={e => setQtyMax(e.target.value)} />
          </div>
        </div>
      </div>

      {/* SUMMARY BAR */}
      {!loading && (
        <div className="ma-summary-bar">
          <div className="ma-summary-left">
            {filtered.length === 0
              ? 'No activities match your filters'
              : <><span>{filtered.length}</span> activit{filtered.length===1?'y':'ies'}{hasFilter?' found':' total'}</>
            }
            {totalPages > 1 && (
              <span style={{color:'#aaa',fontWeight:500,marginLeft:'0.5rem'}}>— page {page} of {totalPages}</span>
            )}
          </div>
          {selectedCount > 0 && (
            <span style={{fontSize:'0.82rem',color:'#d97706',fontWeight:700}}>{selectedCount} selected</span>
          )}
        </div>
      )}

      {/* BULK BAR */}
      {selectedCount > 0 && (
        <div className="ma-bulk-bar">
          <div className="ma-bulk-count">🗂️ {selectedCount} activit{selectedCount===1?'y':'ies'} selected — all eligible for deletion</div>
          <button className="btn-clear-sel" onClick={() => setSelected(new Set())}>Clear selection</button>
          <button className="btn-bulk-delete" onClick={() => setDeleteModal('bulk')} disabled={deleteLoading}>
            🗑️ Delete {selectedCount} Selected
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="ma-empty">
          <div className="ma-empty-icon">⏳</div>
          <div className="ma-empty-title">Loading activities…</div>
        </div>
      )}

      {/* ACTIVITIES */}
      {!loading && filtered.length > 0 && (
        <>
          {pageEligible.length > 0 && (
            <div className="ma-select-all-row" onClick={toggleSelectAllPage}>
              <input type="checkbox" readOnly checked={allPageEligibleSelected}
                onChange={toggleSelectAllPage} onClick={e=>e.stopPropagation()} />
              <span>
                {allPageEligibleSelected
                  ? `Deselect all eligible on this page (${pageEligible.length})`
                  : `Select all eligible on this page (${pageEligible.length})`}
              </span>
            </div>
          )}

          {pageItems.map((activity, idx) => {
            const statusStyle = STATUS_STYLES[activity.status] || STATUS_STYLES.PENDING;
            const actType     = activity.activityType || activity.type;
            const deletable   = DELETABLE_STATUSES.has(activity.status);
            const isSelected  = validSelected.has(activity.id);

            return (
              <div key={activity.id??`ma-${idx}`} className={`ma-card${isSelected?' selected':''}`}>
                {deletable
                  ? <input type="checkbox" className="ma-card-check" checked={isSelected} onChange={() => toggleOne(activity.id)} />
                  : <input type="checkbox" className="ma-card-check" disabled style={{opacity:0.3}} />
                }
                <div className="ma-card-icon">{getIcon(actType)}</div>
                <div className="ma-card-body">
                  <div className="ma-card-title">{fmtType(actType)}</div>
                  <div className="ma-card-meta">
                    <span>📅 {fmt(activity.createdAt||activity.date)}</span>
                    <span>📦 Qty: {activity.declaredQuantity??activity.quantity??'-'}</span>
                    <span className="pts">⚡ {activity.carbonPoints||activity.points||0} pts</span>
                    {activity.description && <span style={{color:'#999'}}>💬 {activity.description}</span>}
                  </div>
                  {activity.status==='REJECTED'&&activity.rejectionReason&&(
                    <div style={{marginTop:'0.35rem',fontSize:'0.8rem',color:'#dc2626',fontWeight:600}}>
                      ❌ {activity.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="ma-card-right">
                  <span className="ma-status-pill" style={{background:statusStyle.bg,color:statusStyle.color}}>
                    {statusStyle.label}
                  </span>
                  {deletable
                    ? <button className="btn-delete-single" title="Delete activity" onClick={() => setDeleteModal(activity.id)}>🗑️</button>
                    : <span className="ma-protected-note">🔒 Protected</span>
                  }
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="ma-pagination">
              <button className="ma-page-btn" disabled={page===1} onClick={() => setPage(p=>Math.max(1,p-1))}>← Prev</button>
              {Array.from({length:totalPages},(_,i)=>i+1)
                .filter(p=>p===1||p===totalPages||Math.abs(p-page)<=2)
                .reduce((acc,p,i,arr)=>{if(i>0&&p-arr[i-1]>1)acc.push('…');acc.push(p);return acc;},[])
                .map((item,i)=>
                  item==='…'
                    ?<span key={`e${i}`} style={{padding:'0.5rem 0.25rem',color:'#aaa'}}>…</span>
                    :<button key={item} className={`ma-page-btn${page===item?' active':''}`} onClick={()=>setPage(item)}>{item}</button>
                )
              }
              <button className="ma-page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* EMPTY */}
      {!loading && filtered.length === 0 && (
        <div className="ma-empty">
          <div className="ma-empty-icon">{hasFilter?'😶‍🌫️':'🌱'}</div>
          <div className="ma-empty-title">{hasFilter?'No activities match your filters':'No activities yet'}</div>
          <div className="ma-empty-sub">{hasFilter?'Try clearing filters or adjusting your search.':'Submit your first activity to get started!'}</div>
          {hasFilter && <button className="btn btn-primary" style={{marginTop:'1rem'}} onClick={clearFilters}>Clear Filters</button>}
        </div>
      )}

      {/* SINGLE DELETE MODAL */}
      {deleteModal!==null&&deleteModal!=='bulk'&&(
        <div className="ma-modal-overlay" onClick={()=>!deleteLoading&&setDeleteModal(null)}>
          <div className="ma-modal" onClick={e=>e.stopPropagation()}>
            <div className="ma-modal-header">
              <h3>🗑️ Delete Activity</h3>
              <button className="ma-modal-close" disabled={deleteLoading} onClick={()=>setDeleteModal(null)}>×</button>
            </div>
            <div className="ma-modal-body">
              <p>Are you sure you want to permanently delete <strong>Activity #{deleteModal}</strong>?</p>
              <p style={{color:'#888',fontSize:'0.82rem',marginTop:'0.5rem'}}>This action cannot be undone.</p>
            </div>
            <div className="ma-modal-footer">
              <button className="btn-cancel-modal" disabled={deleteLoading} onClick={()=>setDeleteModal(null)}>Cancel</button>
              <button className="btn-confirm-delete" disabled={deleteLoading} onClick={confirmSingleDelete}>
                {deleteLoading?'Deleting…':'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE MODAL */}
      {deleteModal==='bulk'&&(
        <div className="ma-modal-overlay" onClick={()=>!deleteLoading&&setDeleteModal(null)}>
          <div className="ma-modal" onClick={e=>e.stopPropagation()}>
            <div className="ma-modal-header">
              <h3>🗑️ Bulk Delete Activities</h3>
              <button className="ma-modal-close" disabled={deleteLoading} onClick={()=>setDeleteModal(null)}>×</button>
            </div>
            <div className="ma-modal-body">
              <p>You are about to permanently delete{' '}
                <strong>{selectedCount} activit{selectedCount===1?'y':'ies'}</strong>.
              </p>
              <p style={{color:'#888',fontSize:'0.82rem',marginTop:'0.5rem'}}>
                Only <strong>Declared</strong> or <strong>Pending</strong> activities will be deleted.
                Approved or verified activities are automatically protected and skipped.
                This action cannot be undone.
              </p>
            </div>
            <div className="ma-modal-footer">
              <button className="btn-cancel-modal" disabled={deleteLoading} onClick={()=>setDeleteModal(null)}>Cancel</button>
              <button className="btn-confirm-delete" disabled={deleteLoading} onClick={confirmBulkDelete}>
                {deleteLoading?'Deleting…':`Delete ${selectedCount} Selected`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyActivities;
