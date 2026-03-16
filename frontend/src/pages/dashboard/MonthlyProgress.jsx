/**
 * MonthlyProgress — enhanced user analytics page.
 *
 * Data scope: exclusively the logged-in user's activities via
 *   GET /api/activities   (JWT enforces user_id on the backend — no admin data leaks)
 *
 * Shared code: imports chart utilities & CustomTooltip from components/analytics/
 *   (same files used by Admin.jsx → no duplication)
 *
 * Layout: Filters → KPI banner → Stats cards → Charts → Activity Log
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../api/axios';

// ── Reuse the same constants, helpers, and tooltip as Admin ──────
import {
  CHART_COLORS, PIE_COLORS, STATUS_PIE_COLORS,
  getCatKey, getActivityDate, buildTimelineData,
  todayStr, currentYearStart, weekStartStr, monthStartStr,
} from '../../components/analytics/chartUtils';
import CustomTooltip from '../../components/analytics/CustomTooltip';

// ─── Quick-filter presets ────────────────────────────────────────
const QUICK_FILTERS = [
  { label: 'Today',      gran: 'HOUR',  getRange: () => ({ from: todayStr(),         to: todayStr()   }) },
  { label: 'This Week',  gran: 'DAY',   getRange: () => ({ from: weekStartStr(),     to: todayStr()   }) },
  { label: 'This Month', gran: 'DAY',   getRange: () => ({ from: monthStartStr(),    to: todayStr()   }) },
  { label: 'This Year',  gran: 'MONTH', getRange: () => ({ from: currentYearStart(), to: todayStr()   }) },
];

// ─── UI option arrays ────────────────────────────────────────────
const GRANULARITY_OPTIONS = [
  { key: 'YEAR',  label: '🗓️ Yearly'  },
  { key: 'MONTH', label: '📆 Monthly' },
  { key: 'DAY',   label: '📅 Daily'   },
  { key: 'HOUR',  label: '⏰ Hourly'  },
];
const CHART_TYPE_OPTIONS = [
  { key: 'bar',  label: '📊 Bar'  },
  { key: 'line', label: '📈 Line' },
  { key: 'area', label: '🌊 Area' },
];

// ─── Inline style helpers (match Admin Analytics spacing/palette) ─
const card = (extra = {}) => ({
  background: '#fff',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1.5px solid #e2eeec',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  marginBottom: '1.5rem',
  ...extra,
});
const cardTitle   = { fontSize: '0.92rem', fontWeight: 800, color: '#1a1a1a', marginBottom: '1.25rem' };
const btnGroup    = { display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #e2eeec' };
const btnGroupBtn = (active) => ({
  padding: '0.55rem 1rem', fontSize: '0.8rem', fontWeight: 700,
  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
  background: active ? '#2a9d8f' : '#fff', color: active ? '#fff' : '#888',
});
const quickBtn = (active) => ({
  padding: '0.45rem 0.9rem', borderRadius: '20px',
  border: '1.5px solid ' + (active ? '#2a9d8f' : '#e2eeec'),
  background: active ? '#2a9d8f' : '#fff', color: active ? '#fff' : '#666',
  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
  transition: 'all 0.2s', whiteSpace: 'nowrap',
});
const fieldLabel = {
  fontSize: '0.72rem', fontWeight: 700, color: '#888',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem',
};
const dateInput = {
  padding: '0.6rem 0.9rem', border: '1.5px solid #e2eeec',
  borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600,
  background: '#f8fffe', outline: 'none', cursor: 'pointer',
};

// ─── Status badge helper ─────────────────────────────────────────
const statusBadge = (status) => ({
  color:      status === 'APPROVED' ? '#059669' : status === 'REJECTED' ? '#dc2626' : '#d97706',
  background: status === 'APPROVED' ? '#d1fae5' : status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
  padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
  display: 'inline-block',
});

// ─── Component ───────────────────────────────────────────────────
const MonthlyProgress = () => {
  // Filter state
  const [dateFrom,    setDateFrom]    = useState(currentYearStart());
  const [dateTo,      setDateTo]      = useState(todayStr());
  const [granularity, setGranularity] = useState('MONTH');
  const [chartType,   setChartType]   = useState('bar');
  const [activeQuick, setActiveQuick] = useState('This Year');

  // Activity data — scoped to current user by the backend (JWT)
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Activity log sort state
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir,   setSortDir]   = useState('desc');

  // ── Fetch all user activities ──────────────────────────────────
  // The backend enforces user_id from JWT — no cross-user data possible.
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res  = await api.get('/api/activities');
      const data = res?.data?.data ?? res?.data ?? [];
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  // ── Client-side date-range filter ─────────────────────────────
  const filteredActivities = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
    const to   = dateTo   ? new Date(dateTo   + 'T23:59:59') : null;
    return activities.filter(a => {
      const d = getActivityDate(a);
      if (!d) return true;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    });
  }, [activities, dateFrom, dateTo]);

  // ── KPIs ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = filteredActivities.length;
    const approved  = filteredActivities.filter(a => a.status === 'APPROVED').length;
    const rejected  = filteredActivities.filter(a => a.status === 'REJECTED').length;
    const pending   = filteredActivities.filter(a => a.status !== 'APPROVED' && a.status !== 'REJECTED').length;
    const trees     = filteredActivities.filter(a => getCatKey(a) === 'tree').length;
    const transport = filteredActivities.filter(a => getCatKey(a) === 'transport').length;
    const recycling = filteredActivities.filter(a => getCatKey(a) === 'recycling').length;
    const other     = filteredActivities.filter(a => getCatKey(a) === 'other').length;
    const totalPts  = filteredActivities
      .filter(a => a.status === 'APPROVED')
      .reduce((s, a) => s + (a.points || 0), 0);
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';
    return { total, approved, rejected, pending, trees, transport, recycling, other, totalPts, approvalRate };
  }, [filteredActivities]);

  // ── Month-over-month performance insight ─────────────────────
  const performanceInsight = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthPoints = activities.reduce((sum, a) => {
      const d = getActivityDate(a);
      if (!d) return sum;
      if (d >= currentMonthStart && d < nextMonthStart && a.status === 'APPROVED') {
        return sum + (a.points || 0);
      }
      return sum;
    }, 0);

    const previousMonthPoints = activities.reduce((sum, a) => {
      const d = getActivityDate(a);
      if (!d) return sum;
      if (d >= previousMonthStart && d < currentMonthStart && a.status === 'APPROVED') {
        return sum + (a.points || 0);
      }
      return sum;
    }, 0);

    const isBothZero = previousMonthPoints === 0 && currentMonthPoints === 0;
    if (isBothZero) {
      return {
        title: '📊 Performance Insight',
        icon: '➡',
        message: 'Start contributing this month to see your progress here.',
        color: '#6b7280',
        background: '#f3f4f6',
        border: '#e5e7eb',
      };
    }

    if (previousMonthPoints === 0 && currentMonthPoints > 0) {
      return {
        title: '📊 Performance Insight',
        icon: '📈',
        message: 'Your contribution increased by 100% compared to last month. Great progress!',
        color: '#15803d',
        background: '#ecfdf3',
        border: '#bbf7d0',
      };
    }

    const rawChange = ((currentMonthPoints - previousMonthPoints) / previousMonthPoints) * 100;
    const percentageChange = Math.round(rawChange);

    if (percentageChange > 0) {
      return {
        title: '📊 Performance Insight',
        icon: '📈',
        message: `Your contribution increased by ${percentageChange}% compared to last month. Great progress!`,
        color: '#15803d',
        background: '#ecfdf3',
        border: '#bbf7d0',
      };
    }

    if (percentageChange < 0) {
      return {
        title: '📊 Performance Insight',
        icon: '📉',
        message: `Your contribution decreased by ${Math.abs(percentageChange)}% compared to last month. Try to contribute more this month.`,
        color: '#c2410c',
        background: '#fff7ed',
        border: '#fed7aa',
      };
    }

    return {
      title: '📊 Performance Insight',
      icon: '➡',
      message: 'Your contribution is the same as last month.',
      color: '#6b7280',
      background: '#f3f4f6',
      border: '#e5e7eb',
    };
  }, [activities]);

  // ── Timeline data (granularity-aware) — same helper as Admin ──
  const timelineData = useMemo(
    () => buildTimelineData(filteredActivities, granularity),
    [filteredActivities, granularity],
  );

  // ── Pie chart data ─────────────────────────────────────────────
  const pieData = [
    { name: '🌳 Tree Plantation', value: stats.trees     },
    { name: '🚌 Public Transport', value: stats.transport },
    { name: '♻️ Recycling',       value: stats.recycling  },
    { name: '📦 Other',           value: stats.other      },
  ].filter(d => d.value > 0);

  const statusPieData = [
    { name: 'Approved', value: stats.approved },
    { name: 'Rejected', value: stats.rejected },
    { name: 'Pending',  value: stats.pending  },
  ].filter(d => d.value > 0);

  // ── Sortable activity log ──────────────────────────────────────
  const sortedLog = useMemo(() => {
    return [...filteredActivities].sort((a, b) => {
      if (sortField === 'createdAt') {
        const da = getActivityDate(a)?.getTime() ?? 0;
        const db = getActivityDate(b)?.getTime() ?? 0;
        return sortDir === 'asc' ? da - db : db - da;
      }
      if (sortField === 'status') {
        const sa = a.status ?? ''; const sb = b.status ?? '';
        return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
      }
      return 0;
    });
  }, [filteredActivities, sortField, sortDir]);

  // ── Quick filter handler ───────────────────────────────────────
  const applyQuickFilter = (qf) => {
    const { from, to } = qf.getRange();
    setDateFrom(from);
    setDateTo(to);
    setGranularity(qf.gran);
    setActiveQuick(qf.label);
  };

  const handleGranularityChange = (g) => {
    setGranularity(g);
    if (g === 'HOUR') {
      setDateFrom(todayStr()); setDateTo(todayStr()); setActiveQuick('Today');
    }
  };

  // ── Sort toggle ────────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ── Chart rendering (same pattern as Admin AnalyticsEngine) ───
  const ChartComp = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart;

  const renderSeries = (dataKey, color) => {
    if (chartType === 'bar')
      return <Bar  key={dataKey} dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />;
    if (chartType === 'line')
      return <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} />;
    return <Area key={dataKey} type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />;
  };

  const hasData = filteredActivities.length > 0;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="dashboard-page">

      {/* PAGE HEADER */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="dashboard-title">📈 Monthly Progress</h1>
          <p className="dashboard-subtitle">Your personal carbon contribution analytics.</p>
        </div>
        <button onClick={fetchActivities} disabled={loading} className="btn btn-primary">
          {loading ? '⏳ Loading…' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* FILTER PANEL */}
      <div style={card()}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={fieldLabel}>Quick Filters</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
            {QUICK_FILTERS.map(qf => (
              <button key={qf.label} onClick={() => applyQuickFilter(qf)} style={quickBtn(activeQuick === qf.label)}>
                {qf.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={fieldLabel}>From</div>
            <input type="date" style={dateInput} value={dateFrom} max={dateTo || undefined}
              onChange={e => { setDateFrom(e.target.value); setActiveQuick(''); }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={fieldLabel}>To</div>
            <input type="date" style={dateInput} value={dateTo} min={dateFrom || undefined}
              onChange={e => { setDateTo(e.target.value); setActiveQuick(''); }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={fieldLabel}>Granularity</div>
            <div style={btnGroup}>
              {GRANULARITY_OPTIONS.map(g => (
                <button key={g.key} onClick={() => handleGranularityChange(g.key)} style={btnGroupBtn(granularity === g.key)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={fieldLabel}>Chart Style</div>
            <div style={btnGroup}>
              {CHART_TYPE_OPTIONS.map(t => (
                <button key={t.key} onClick={() => setChartType(t.key)} style={btnGroupBtn(chartType === t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {granularity === 'HOUR' && (
          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.75rem' }}>
            ℹ️ Hourly view works best when From and To are the same day.
          </div>
        )}
      </div>

      {/* APPROVAL RATE BANNER */}
      <div style={{ background: 'linear-gradient(135deg, #0f4d43, #2a9d8f)', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{stats.approvalRate}%</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>Approval Rate</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.65, marginTop: 3 }}>{stats.approved} approved of {stats.total} total</div>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '99px', height: 10 }}>
            <div style={{ height: '100%', borderRadius: '99px', background: '#fff', width: `${Math.min(100, stats.approvalRate)}%`, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.75rem', opacity: 0.7 }}>
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[['✅', stats.approved, 'Approved'], ['❌', stats.rejected, 'Rejected'], ['⏳', stats.pending, 'Pending']].map(([icon, val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{val}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>{icon} {label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PERFORMANCE INSIGHT */}
      <div style={card({
        textAlign: 'center',
        background: performanceInsight.background,
        border: `1.5px solid ${performanceInsight.border}`,
      })}>
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1a1a1a', marginBottom: '0.4rem' }}>
          {performanceInsight.title}
        </div>
        <div style={{
          fontSize: '1.05rem',
          fontWeight: 800,
          color: performanceInsight.color,
          lineHeight: 1.45,
          maxWidth: '760px',
          margin: '0 auto',
        }}>
          {performanceInsight.icon} {performanceInsight.message}
        </div>
      </div>

      {/* KPI STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          ['📋', stats.total,     'Total Activities',  '#264653'],
          ['✅', stats.approved,  'Approved',          '#059669'],
          ['❌', stats.rejected,  'Rejected',          '#dc2626'],
          ['⏳', stats.pending,   'Pending',           '#d97706'],
          ['🌱', stats.totalPts,  'Total Points',      '#2a9d8f'],
          ['🌳', stats.trees,     'Tree Plantation',   '#16a34a'],
          ['🚌', stats.transport, 'Public Transport',  '#2a9d8f'],
          ['♻️', stats.recycling, 'Recycling',          '#7c3aed'],
        ].map(([icon, val, label, color]) => (
          <div key={label} style={{ background: '#fff', borderRadius: '14px', padding: '1rem 1.1rem', border: '1.5px solid #e2eeec', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 600, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Loading / empty state */}
      {loading && <div className="page-state">Loading your activity data…</div>}

      {!loading && !hasData && (
        <div style={{ ...card(), textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
          <div style={{ fontWeight: 700, color: '#888' }}>No activities found for the selected period</div>
          <div style={{ fontSize: '0.82rem', color: '#bbb', marginTop: '0.25rem' }}>Try a wider date range or a different granularity</div>
        </div>
      )}

      {/* ── CHARTS ──────────────────────────────────────────────── */}
      {!loading && hasData && (
        <>
          {/* Points over time — approved activities */}
          <div style={card()}>
            <div style={cardTitle}>🌱 Points Over Time — Approved Activities</div>
            <ResponsiveContainer width="100%" height={280}>
              <ChartComp data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {renderSeries('Points', CHART_COLORS.points)}
              </ChartComp>
            </ResponsiveContainer>
          </div>

          {/* Approved vs Rejected — same visual as Admin AnalyticsEngine */}
          <div style={card()}>
            <div style={cardTitle}>✅ Approved vs Rejected</div>
            <ResponsiveContainer width="100%" height={260}>
              <ChartComp data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {renderSeries('Approved', CHART_COLORS.approved)}
                {renderSeries('Rejected', CHART_COLORS.rejected)}
              </ChartComp>
            </ResponsiveContainer>
          </div>

          {/* Activities by Category — same visual as Admin AnalyticsEngine */}
          <div style={card()}>
            <div style={cardTitle}>📊 Activities by Category</div>
            <ResponsiveContainer width="100%" height={280}>
              <ChartComp data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {renderSeries('Tree Plantation', CHART_COLORS.tree)}
                {renderSeries('Public Transport', CHART_COLORS.transport)}
                {renderSeries('Recycling',        CHART_COLORS.recycling)}
              </ChartComp>
            </ResponsiveContainer>
          </div>

          {/* Pie charts — same visual as Admin AnalyticsEngine */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={card({ marginBottom: 0 })}>
              <div style={cardTitle}>🥧 Category Split</div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name.split(' ').slice(1).join(' ')} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} activities`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>No data</div>}
            </div>

            <div style={card({ marginBottom: 0 })}>
              <div style={cardTitle}>🔵 Status Split</div>
              {statusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {statusPieData.map((_, i) => <Cell key={i} fill={STATUS_PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} activities`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>No data</div>}
            </div>
          </div>

          {/* ACTIVITY LOG */}
          <div style={card()}>
            <div style={cardTitle}>
              📄 Activity Log — {filteredActivities.length} record{filteredActivities.length !== 1 ? 's' : ''} in selected period
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    {[
                      { label: '#',        field: null        },
                      { label: 'Category', field: null        },
                      { label: 'Quantity', field: null        },
                      { label: 'Points',   field: null        },
                      { label: 'Date',     field: 'createdAt' },
                      { label: 'Status',   field: 'status'    },
                    ].map(({ label, field }) => (
                      <th key={label} onClick={field ? () => toggleSort(field) : undefined}
                        style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: '#888', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', borderBottom: '1.5px solid #e2eeec', background: '#f8fffe', cursor: field ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                        {label}
                        {field && sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : field ? ' ↕' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedLog.slice(0, 100).map((a, i) => {
                    const cat      = getCatKey(a);
                    const catIcon  = cat === 'tree' ? '🌳' : cat === 'transport' ? '🚌' : cat === 'recycling' ? '♻️' : '📦';
                    const catLabel = cat === 'tree' ? 'Tree Plantation' : cat === 'transport' ? 'Public Transport' : cat === 'recycling' ? 'Recycling' : 'Other';
                    const d        = getActivityDate(a);
                    const sLabel   = a.status === 'PROOF_SUBMITTED' ? 'Ready for Review'
                                   : a.status === 'DECLARED'        ? 'Declared'
                                   : a.status                       ?? 'Pending';
                    return (
                      <tr key={a.id ?? i} style={{ borderBottom: '1px solid #f0f4f3', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fffe'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#aaa', fontWeight: 700, fontSize: '0.78rem' }}>#{a.id}</td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>{catIcon} {catLabel}</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>{a.declaredQuantity ?? a.quantity ?? '-'}</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#2a9d8f' }}>{a.points ?? 0} pts</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', color: '#666' }}>
                          {d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                            {d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <span style={statusBadge(a.status)}>{sLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sortedLog.length > 100 && (
                <div style={{ textAlign: 'center', padding: '0.75rem', color: '#888', fontSize: '0.82rem' }}>
                  Showing first 100 of {sortedLog.length} records
                </div>
              )}
              {sortedLog.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No activities in this date range</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyProgress;
