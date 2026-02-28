import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// ─── CONSTANTS ───────────────────────────────────────────────────
const STATUS_STYLES = {
  PENDING: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  DECLARED: { bg: '#e0e7ff', color: '#4f46e5', label: 'Declared' },
  PROOF_SUBMITTED: { bg: '#fef3c7', color: '#d97706', label: 'Ready for Review' },
  APPROVED: { bg: '#d1fae5', color: '#059669', label: 'Approved' },
  REJECTED: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' }
};

const CATEGORIES = [
  { key: 'TREE_PLANTATION', label: 'Tree Plantation', icon: '🌳', unit: 'trees', color: '#16a34a' },
  { key: 'PUBLIC_TRANSPORT', label: 'Public Transport', icon: '🚌', unit: 'km', color: '#2a9d8f' },
  { key: 'RECYCLING', label: 'Recycling', icon: '♻️', unit: 'kg', color: '#7c3aed' },
];

const CHART_COLORS = {
  tree: '#16a34a', transport: '#2a9d8f', recycling: '#7c3aed',
  approved: '#059669', rejected: '#dc2626', pending: '#d97706',
};
const PIE_COLORS = ['#16a34a', '#2a9d8f', '#7c3aed'];
const STATUS_PIE_COLORS = ['#059669', '#dc2626', '#d97706'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── HELPERS ─────────────────────────────────────────────────────
const getCatKey = (activity) => {
  const type = (activity.activityType || activity.type || '').toUpperCase().replace(/ /g, '_');
  if (type.includes('TREE')) return 'tree';
  if (type.includes('TRANSPORT')) return 'transport';
  if (type.includes('RECYCLING')) return 'recycling';
  return 'other';
};

const getActivityDate = (activity) => {
  const ts = activity.createdAt || activity.date;
  return ts ? new Date(ts) : null;
};

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
      <div style={{background:'#fff', border:'1.5px solid #e2eeec', borderRadius:'10px', padding:'0.75rem 1rem', boxShadow:'0 4px 16px rgba(0,0,0,0.1)'}}>
        <div style={{fontWeight:800, color:'#1a1a1a', marginBottom:'0.4rem', fontSize:'0.85rem'}}>{label}</div>
        {payload.map((p, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.82rem', color:'#555'}}>
              <span style={{width:10, height:10, borderRadius:'50%', background:p.color, display:'inline-block'}}></span>
              {p.name}: <strong style={{color:p.color}}>{p.value}</strong>
            </div>
        ))}
      </div>
  );
};

// ─── ANALYTICS ENGINE ────────────────────────────────────────────
const AnalyticsEngine = ({ activities }) => {
  const now = new Date();
  const [viewMode, setViewMode] = useState('month');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [chartType, setChartType] = useState('bar');

  const availableYears = useMemo(() => {
    const years = new Set([now.getFullYear()]);
    activities.forEach(a => { const d = getActivityDate(a); if (d) years.add(d.getFullYear()); });
    return [...years].sort((a, b) => b - a);
  }, [activities]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const d = getActivityDate(a);
      if (!d) return false;
      if (viewMode === 'year') return d.getFullYear() === selectedYear;
      if (viewMode === 'month') return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      if (viewMode === 'day') return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === selectedDay;
      return true;
    });
  }, [activities, viewMode, selectedYear, selectedMonth, selectedDay]);

  const stats = useMemo(() => {
    const total = filteredActivities.length;
    const approved = filteredActivities.filter(a => a.status === 'APPROVED').length;
    const rejected = filteredActivities.filter(a => a.status === 'REJECTED').length;
    const pending = filteredActivities.filter(a => a.status === 'PENDING' || a.status === 'PROOF_SUBMITTED').length;
    const trees = filteredActivities.filter(a => getCatKey(a) === 'tree').length;
    const transport = filteredActivities.filter(a => getCatKey(a) === 'transport').length;
    const recycling = filteredActivities.filter(a => getCatKey(a) === 'recycling').length;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
    return { total, approved, rejected, pending, trees, transport, recycling, approvalRate };
  }, [filteredActivities]);

  const timelineData = useMemo(() => {
    const makeEntry = (acts, name) => ({
      name,
      'Tree Plantation': acts.filter(a => getCatKey(a) === 'tree').length,
      'Public Transport': acts.filter(a => getCatKey(a) === 'transport').length,
      'Recycling': acts.filter(a => getCatKey(a) === 'recycling').length,
      'Total': acts.length,
      'Approved': acts.filter(a => a.status === 'APPROVED').length,
      'Rejected': acts.filter(a => a.status === 'REJECTED').length,
    });

    if (viewMode === 'year') {
      return MONTHS.map((month, i) => makeEntry(
          activities.filter(a => { const d = getActivityDate(a); return d && d.getFullYear() === selectedYear && d.getMonth() === i; }),
          month
      ));
    }
    if (viewMode === 'month') {
      return Array.from({ length: daysInMonth }, (_, i) => makeEntry(
          activities.filter(a => { const d = getActivityDate(a); return d && d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === i + 1; }),
          `${i + 1}`
      ));
    }
    if (viewMode === 'day') {
      return Array.from({ length: 24 }, (_, hour) => makeEntry(
          activities.filter(a => { const d = getActivityDate(a); return d && d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === selectedDay && d.getHours() === hour; }),
          `${hour}:00`
      ));
    }
    return [];
  }, [activities, viewMode, selectedYear, selectedMonth, selectedDay, daysInMonth]);

  const pieData = [
    { name: '🌳 Tree Plantation', value: stats.trees },
    { name: '🚌 Public Transport', value: stats.transport },
    { name: '♻️ Recycling', value: stats.recycling },
  ].filter(d => d.value > 0);

  const statusPieData = [
    { name: 'Approved', value: stats.approved },
    { name: 'Rejected', value: stats.rejected },
    { name: 'Pending', value: stats.pending },
  ].filter(d => d.value > 0);

  const periodLabel = viewMode === 'year' ? `Year ${selectedYear}`
      : viewMode === 'month' ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
          : `${selectedDay} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  const ChartComp = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart;

  const renderSeries = (dataKey, color) => {
    if (chartType === 'bar') return <Bar key={dataKey} dataKey={dataKey} fill={color} radius={[4,4,0,0]} />;
    if (chartType === 'line') return <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} />;
    return <Area key={dataKey} type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />;
  };

  return (
      <div>
        {/* PERIOD LABEL */}
        <div style={{fontSize:'1.4rem', fontWeight:900, color:'#1a1a1a', marginBottom:'1.5rem'}}>
          📊 Analytics — <span style={{color:'#2a9d8f'}}>{periodLabel}</span>
        </div>

        {/* CONTROLS */}
        <div style={{background:'#fff', border:'1.5px solid #e2eeec', borderRadius:'16px', padding:'1.25rem 1.5rem', marginBottom:'1.5rem', display:'flex', flexWrap:'wrap', gap:'1.25rem', alignItems:'flex-end'}}>
          {/* View Mode */}
          <div style={{display:'flex', flexDirection:'column', gap:'0.35rem'}}>
            <div style={{fontSize:'0.72rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em'}}>View By</div>
            <div style={{display:'flex', borderRadius:'10px', overflow:'hidden', border:'1.5px solid #e2eeec'}}>
              {[['day','📅 Day'],['month','📆 Month'],['year','🗓️ Year']].map(([mode, label]) => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{padding:'0.6rem 1rem', fontSize:'0.82rem', fontWeight:700, border:'none', cursor:'pointer', transition:'all 0.2s', background: viewMode === mode ? '#2a9d8f' : '#fff', color: viewMode === mode ? '#fff' : '#888'}}>
                    {label}
                  </button>
              ))}
            </div>
          </div>

          {/* Year */}
          <div style={{display:'flex', flexDirection:'column', gap:'0.35rem'}}>
            <div style={{fontSize:'0.72rem', fontWeight:700, color:'#888', textTransform:'uppercase'}}>Year</div>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{padding:'0.6rem 0.9rem', border:'1.5px solid #e2eeec', borderRadius:'10px', fontSize:'0.88rem', fontWeight:600, background:'#f8fffe', cursor:'pointer', outline:'none'}}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Month */}
          {(viewMode === 'month' || viewMode === 'day') && (
              <div style={{display:'flex', flexDirection:'column', gap:'0.35rem'}}>
                <div style={{fontSize:'0.72rem', fontWeight:700, color:'#888', textTransform:'uppercase'}}>Month</div>
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{padding:'0.6rem 0.9rem', border:'1.5px solid #e2eeec', borderRadius:'10px', fontSize:'0.88rem', fontWeight:600, background:'#f8fffe', cursor:'pointer', outline:'none'}}>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
          )}

          {/* Day */}
          {viewMode === 'day' && (
              <div style={{display:'flex', flexDirection:'column', gap:'0.35rem'}}>
                <div style={{fontSize:'0.72rem', fontWeight:700, color:'#888', textTransform:'uppercase'}}>Day</div>
                <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))} style={{padding:'0.6rem 0.9rem', border:'1.5px solid #e2eeec', borderRadius:'10px', fontSize:'0.88rem', fontWeight:600, background:'#f8fffe', cursor:'pointer', outline:'none'}}>
                  {Array.from({length: daysInMonth}, (_, i) => i+1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
          )}

          {/* Chart Type */}
          <div style={{display:'flex', flexDirection:'column', gap:'0.35rem'}}>
            <div style={{fontSize:'0.72rem', fontWeight:700, color:'#888', textTransform:'uppercase'}}>Chart Style</div>
            <div style={{display:'flex', borderRadius:'10px', overflow:'hidden', border:'1.5px solid #e2eeec'}}>
              {[['bar','📊 Bar'],['line','📈 Line'],['area','🌊 Area']].map(([type, label]) => (
                  <button key={type} onClick={() => setChartType(type)} style={{padding:'0.6rem 0.85rem', fontSize:'0.78rem', fontWeight:700, border:'none', cursor:'pointer', transition:'all 0.2s', background: chartType === type ? '#2a9d8f' : '#fff', color: chartType === type ? '#fff' : '#888'}}>
                    {label}
                  </button>
              ))}
            </div>
          </div>
        </div>

        {/* APPROVAL RATE BANNER */}
        <div style={{background:'linear-gradient(135deg, #0f4d43, #2a9d8f)', borderRadius:'16px', padding:'1.25rem 1.5rem', marginBottom:'1.5rem', color:'#fff', display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:'3rem', fontWeight:900, lineHeight:1}}>{stats.approvalRate}%</div>
            <div style={{fontSize:'0.9rem', opacity:0.85}}>Approval Rate</div>
            <div style={{fontSize:'0.75rem', opacity:0.65, marginTop:3}}>{stats.approved} approved out of {stats.total} total</div>
          </div>
          <div style={{flex:1, minWidth:120}}>
            <div style={{background:'rgba(255,255,255,0.2)', borderRadius:'99px', height:10}}>
              <div style={{height:'100%', borderRadius:'99px', background:'#fff', width:`${stats.approvalRate}%`, transition:'width 0.5s ease'}}></div>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'0.4rem', fontSize:'0.75rem', opacity:0.7}}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div style={{display:'flex', gap:'1.5rem', flexWrap:'wrap'}}>
            {[['✅', stats.approved, 'Approved'], ['❌', stats.rejected, 'Rejected'], ['⏳', stats.pending, 'Pending']].map(([icon, val, label]) => (
                <div key={label} style={{textAlign:'center'}}>
                  <div style={{fontSize:'1.5rem', fontWeight:900}}>{val}</div>
                  <div style={{fontSize:'0.72rem', opacity:0.75}}>{icon} {label}</div>
                </div>
            ))}
          </div>
        </div>

        {/* STATS GRID */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:'0.75rem', marginBottom:'1.5rem'}}>
          {[
            ['📋', stats.total, 'Total Activities', '#264653', 'total'],
            ['✅', stats.approved, 'Approved', '#059669', 'approved'],
            ['❌', stats.rejected, 'Rejected', '#dc2626', 'rejected'],
            ['⏳', stats.pending, 'Pending', '#d97706', 'pending'],
            ['🌳', stats.trees, 'Tree Plantation', '#16a34a', 'tree'],
            ['🚌', stats.transport, 'Public Transport', '#2a9d8f', 'transport'],
            ['♻️', stats.recycling, 'Recycling', '#7c3aed', 'recycling'],
          ].map(([icon, val, label, color]) => (
              <div key={label} style={{background:'#fff', borderRadius:'14px', padding:'1rem 1.1rem', border:'1.5px solid #e2eeec', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', borderTop:`3px solid ${color}`}}>
                <div style={{fontSize:'1.5rem', marginBottom:'0.3rem'}}>{icon}</div>
                <div style={{fontSize:'1.8rem', fontWeight:900, color, lineHeight:1}}>{val}</div>
                <div style={{fontSize:'0.72rem', color:'#888', fontWeight:600, marginTop:3}}>{label}</div>
              </div>
          ))}
        </div>

        {stats.total === 0 ? (
            <div style={{background:'#fff', borderRadius:'16px', padding:'3rem', border:'1.5px solid #e2eeec', textAlign:'center'}}>
              <div style={{fontSize:'3rem', marginBottom:'0.75rem'}}>📭</div>
              <div style={{fontWeight:700, color:'#888'}}>No activities found for {periodLabel}</div>
              <div style={{fontSize:'0.82rem', color:'#bbb', marginTop:'0.25rem'}}>Try selecting a different time period</div>
            </div>
        ) : (
            <>
              {/* CATEGORY CHART */}
              <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', border:'1.5px solid #e2eeec', marginBottom:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:'0.92rem', fontWeight:800, color:'#1a1a1a', marginBottom:'1.25rem'}}>
                  📊 Activities by Category — <span style={{color:'#2a9d8f'}}>{viewMode === 'year' ? 'Monthly' : viewMode === 'month' ? 'Daily' : 'Hourly'} Breakdown</span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ChartComp data={timelineData} margin={{top:5, right:10, left:-20, bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{fontSize:11}} interval={viewMode === 'month' ? 1 : 0} />
                    <YAxis tick={{fontSize:11}} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {renderSeries('Tree Plantation', CHART_COLORS.tree)}
                    {renderSeries('Public Transport', CHART_COLORS.transport)}
                    {renderSeries('Recycling', CHART_COLORS.recycling)}
                  </ChartComp>
                </ResponsiveContainer>
              </div>

              {/* APPROVAL CHART */}
              <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', border:'1.5px solid #e2eeec', marginBottom:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:'0.92rem', fontWeight:800, color:'#1a1a1a', marginBottom:'1.25rem'}}>
                  ✅ Approved vs Rejected — {periodLabel}
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <ChartComp data={timelineData} margin={{top:5, right:10, left:-20, bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{fontSize:11}} interval={viewMode === 'month' ? 1 : 0} />
                    <YAxis tick={{fontSize:11}} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {renderSeries('Approved', CHART_COLORS.approved)}
                    {renderSeries('Rejected', CHART_COLORS.rejected)}
                  </ChartComp>
                </ResponsiveContainer>
              </div>

              {/* PIE CHARTS */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem'}}>
                <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', border:'1.5px solid #e2eeec', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                  <div style={{fontSize:'0.92rem', fontWeight:800, color:'#1a1a1a', marginBottom:'1rem'}}>🥧 Category Split</div>
                  {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, percent}) => `${name.split(' ').slice(1).join(' ')} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v + ' activities', n]} />
                        </PieChart>
                      </ResponsiveContainer>
                  ) : <div style={{textAlign:'center', color:'#aaa', padding:'2rem'}}>No data</div>}
                </div>

                <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', border:'1.5px solid #e2eeec', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                  <div style={{fontSize:'0.92rem', fontWeight:800, color:'#1a1a1a', marginBottom:'1rem'}}>🔵 Status Split</div>
                  {statusPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                            {statusPieData.map((_, i) => <Cell key={i} fill={STATUS_PIE_COLORS[i]} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v + ' activities', n]} />
                        </PieChart>
                      </ResponsiveContainer>
                  ) : <div style={{textAlign:'center', color:'#aaa', padding:'2rem'}}>No data</div>}
                </div>
              </div>

              {/* ACTIVITY LOG TABLE */}
              <div style={{background:'#fff', borderRadius:'16px', padding:'1.5rem', border:'1.5px solid #e2eeec', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:'0.92rem', fontWeight:800, color:'#1a1a1a', marginBottom:'1.25rem'}}>
                  📄 Activity Log — {periodLabel} ({filteredActivities.length} records)
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.85rem'}}>
                    <thead>
                    <tr>
                      {['#','User','Type','Quantity','Points','Date','Status'].map(h => (
                          <th key={h} style={{textAlign:'left', padding:'0.6rem 0.75rem', color:'#888', fontWeight:700, fontSize:'0.72rem', textTransform:'uppercase', borderBottom:'1.5px solid #e2eeec', background:'#f8fffe'}}>{h}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody>
                    {filteredActivities.slice(0,50).map((a, i) => {
                      const cat = getCatKey(a);
                      const catIcon = cat === 'tree' ? '🌳' : cat === 'transport' ? '🚌' : '♻️';
                      const catLabel = cat === 'tree' ? 'Tree Plantation' : cat === 'transport' ? 'Public Transport' : cat === 'recycling' ? 'Recycling' : 'Other';
                      const sColor = a.status === 'APPROVED' ? '#059669' : a.status === 'REJECTED' ? '#dc2626' : '#d97706';
                      const sBg = a.status === 'APPROVED' ? '#d1fae5' : a.status === 'REJECTED' ? '#fee2e2' : '#fef3c7';
                      const sLabel = a.status === 'PROOF_SUBMITTED' ? 'Ready' : a.status || 'Pending';
                      const d = getActivityDate(a);
                      return (
                          <tr key={a.id || i} style={{borderBottom:'1px solid #f0f4f3'}}>
                            <td style={{padding:'0.65rem 0.75rem', color:'#aaa', fontWeight:700, fontSize:'0.78rem'}}>#{a.id}</td>
                            <td style={{padding:'0.65rem 0.75rem'}}>
                              <div style={{fontWeight:700, color:'#1a1a1a', fontSize:'0.83rem'}}>{a.userName || a.userUsername || 'Unknown'}</div>
                              <div style={{fontSize:'0.72rem', color:'#888'}}>{a.userEmail || ''}</div>
                            </td>
                            <td style={{padding:'0.65rem 0.75rem'}}>{catIcon} {catLabel}</td>
                            <td style={{padding:'0.65rem 0.75rem', fontWeight:700}}>{a.quantity ?? a.declaredQuantity ?? '-'}</td>
                            <td style={{padding:'0.65rem 0.75rem', fontWeight:700, color:'#2a9d8f'}}>{a.carbonPoints || a.points || 0}</td>
                            <td style={{padding:'0.65rem 0.75rem', fontSize:'0.78rem', color:'#666'}}>
                              {d ? d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}) : '-'}
                              <div style={{fontSize:'0.7rem', color:'#aaa'}}>{d ? d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'}) : ''}</div>
                            </td>
                            <td style={{padding:'0.65rem 0.75rem'}}>
                              <span style={{background:sBg, color:sColor, padding:'0.2rem 0.6rem', borderRadius:'20px', fontSize:'0.72rem', fontWeight:700}}>{sLabel}</span>
                            </td>
                          </tr>
                      );
                    })}
                    </tbody>
                  </table>
                  {filteredActivities.length > 50 && (
                      <div style={{textAlign:'center', padding:'0.75rem', color:'#888', fontSize:'0.82rem'}}>Showing 50 of {filteredActivities.length} records</div>
                  )}
                </div>
              </div>
            </>
        )}
      </div>
  );
};

// ─── MAIN ADMIN COMPONENT ────────────────────────────────────────
const Admin = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryTab, setCategoryTab] = useState('ALL');
  const [preview, setPreview] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [mainTab, setMainTab] = useState('activities');
  const [adminSelected, setAdminSelected] = useState(new Set());
  const [adminBulkModal, setAdminBulkModal] = useState(false);
  const [adminBulkLoading, setAdminBulkLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await api.get('/admin/activities');
      const data = res?.data?.data || res?.data || [];
      const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => (getActivityDate(b) || 0) - (getActivityDate(a) || 0))
          : [];
      setActivities(sorted);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/activities/approve/${id}`);
      setActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a));
    } catch (err) { setError(err?.response?.data?.message || 'Failed to approve'); }
    finally { setActionLoading(null); }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal);
    try {
      await api.put(`/admin/activities/reject/${rejectModal}`, { reason: rejectReason || '' });
      setActivities(prev => prev.map(a => a.id === rejectModal ? { ...a, status: 'REJECTED', rejectionReason: rejectReason } : a));
      setRejectModal(null); setRejectReason('');
    } catch (err) { setError(err?.response?.data?.message || 'Failed to reject'); }
    finally { setActionLoading(null); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    setActionLoading(deleteModal);
    try {
      await api.delete(`/admin/activities/${deleteModal}`);
      setActivities(prev => prev.filter(a => a.id !== deleteModal));
      setAdminSelected(prev => { const n = new Set(prev); n.delete(deleteModal); return n; });
      setDeleteModal(null);
    } catch (err) { setError(err?.response?.data?.message || 'Failed to delete'); setDeleteModal(null); }
    finally { setActionLoading(null); }
  };

  const handleAdminBulkDelete = async () => {
    const ids = [...adminSelected];
    if (!ids.length) return;
    setAdminBulkLoading(true);
    try {
      await api.delete('/admin/activities/bulk', { data: { ids } });
      setActivities(prev => prev.filter(a => !ids.includes(a.id)));
      setAdminSelected(new Set()); setAdminBulkModal(false);
    } catch (err) { setError(err?.response?.data?.message || 'Bulk delete failed'); setAdminBulkModal(false); }
    finally { setAdminBulkLoading(false); }
  };

  const toggleAdminOne = (id) => setAdminSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAdminAll = () => {
    if (adminSelected.size === filteredActivities.length && filteredActivities.length > 0) setAdminSelected(new Set());
    else setAdminSelected(new Set(filteredActivities.map(a => a.id)));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  };

  const getProofImageSrc = (proofImage) => {
    if (!proofImage) return null;
    if (proofImage.startsWith('data:') || proofImage.startsWith('http')) return proofImage;
    return `data:image/jpeg;base64,${proofImage}`;
  };

  const getMapLink = (lat, lon) => (lat == null || lon == null) ? null : `https://www.google.com/maps?q=${lat},${lon}`;

  const matchesCategory = (activity) => {
    if (categoryTab === 'ALL') return true;
    const type = (activity.activityType || activity.type || '').toUpperCase().replace(/ /g, '_');
    return type.includes(categoryTab);
  };

  const filteredActivities = activities.filter(a => {
    const statusMatch = statusFilter === 'ALL' || a.status === statusFilter;
    return statusMatch && matchesCategory(a);
  });

  const countByCategory = (catKey) => activities.filter(a => {
    const type = (a.activityType || a.type || '').toUpperCase().replace(/ /g, '_');
    return catKey === 'ALL' ? true : type.includes(catKey);
  }).length;

  const pendingCount = activities.filter(a => a.status === 'PROOF_SUBMITTED' || a.status === 'PENDING').length;

  return (
      <div className="dashboard-page">
        <style>{`
        .admin-main-tabs { display:flex; gap:0; margin-bottom:1.5rem; border-radius:12px; overflow:hidden; border:1.5px solid #e2eeec; width:fit-content; }
        .admin-main-tab { padding:0.7rem 1.5rem; font-weight:700; font-size:0.9rem; border:none; cursor:pointer; transition:all 0.2s; background:#fff; color:#888; }
        .admin-main-tab.active { background:#2a9d8f; color:#fff; }
        .admin-main-tab:hover:not(.active) { background:#f0f4f3; color:#333; }
        .admin-cat-tabs { display:flex; gap:0.75rem; flex-wrap:wrap; margin-bottom:1.5rem; }
        .cat-tab { display:flex; align-items:center; gap:0.5rem; padding:0.75rem 1.25rem; border-radius:12px; border:2px solid #e2eeec; background:#fff; font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s; color:#666; }
        .cat-tab:hover { border-color:#2a9d8f; color:#2a9d8f; }
        .cat-tab.active { background:#2a9d8f; color:#fff; border-color:#2a9d8f; }
        .cat-tab-count { background:rgba(255,255,255,0.3); padding:1px 7px; border-radius:20px; font-size:0.75rem; }
        .cat-tab:not(.active) .cat-tab-count { background:#f0f4f3; color:#888; }
        .status-filters { display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem; }
        .status-filter-btn { padding:0.4rem 1rem; border-radius:20px; border:1.5px solid #e2eeec; background:#fff; font-size:0.8rem; font-weight:600; cursor:pointer; transition:all 0.2s; color:#666; }
        .status-filter-btn:hover { border-color:#2a9d8f; color:#2a9d8f; }
        .status-filter-btn.active { background:#2a9d8f; color:#fff; border-color:#2a9d8f; }
        .activity-cards { display:flex; flex-direction:column; gap:1rem; }
        .activity-review-card { background:#fff; border-radius:16px; border:1.5px solid #e2eeec; box-shadow:0 2px 12px rgba(0,0,0,0.06); overflow:hidden; transition:box-shadow 0.2s; }
        .activity-review-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.1); }
        .arc-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; background:#f8fffe; border-bottom:1px solid #e2eeec; flex-wrap:wrap; gap:0.5rem; }
        .arc-header-left { display:flex; align-items:center; gap:0.75rem; }
        .arc-type { font-weight:800; color:#1a1a1a; font-size:0.95rem; }
        .arc-status { display:inline-flex; align-items:center; padding:0.3rem 0.75rem; border-radius:20px; font-size:0.75rem; font-weight:700; }
        .arc-body { display:grid; grid-template-columns:1fr 1fr; gap:0; }
        @media (max-width:768px) { .arc-body { grid-template-columns:1fr; } }
        .arc-info { padding:1rem 1.25rem; }
        .arc-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem; }
        .arc-info-label { font-size:0.72rem; color:#aaa; font-weight:600; text-transform:uppercase; margin-bottom:2px; }
        .arc-info-value { font-size:0.9rem; font-weight:700; color:#1a1a1a; }
        .arc-photos { padding:1rem 1.25rem; border-left:1px solid #e2eeec; }
        .arc-photos-title { font-size:0.72rem; color:#aaa; font-weight:600; text-transform:uppercase; margin-bottom:0.5rem; }
        .arc-photo-thumb { width:80px; height:80px; border-radius:8px; object-fit:cover; cursor:pointer; border:2px solid #e2eeec; transition:border-color 0.2s; }
        .arc-photo-thumb:hover { border-color:#2a9d8f; }
        .arc-footer { display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1.25rem; border-top:1px solid #e2eeec; background:#fafafa; flex-wrap:wrap; gap:0.5rem; }
        .arc-actions { display:flex; gap:0.5rem; }
        .btn-approve-new { padding:0.5rem 1.2rem; border-radius:8px; background:#16a34a; color:#fff; border:none; font-weight:700; font-size:0.85rem; cursor:pointer; transition:all 0.2s; }
        .btn-approve-new:hover:not(:disabled) { background:#15803d; transform:translateY(-1px); }
        .btn-reject-new { padding:0.5rem 1.2rem; border-radius:8px; background:#dc2626; color:#fff; border:none; font-weight:700; font-size:0.85rem; cursor:pointer; transition:all 0.2s; }
        .btn-reject-new:hover:not(:disabled) { background:#b91c1c; transform:translateY(-1px); }
        .btn-approve-new:disabled, .btn-reject-new:disabled { opacity:0.6; cursor:not-allowed; }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:999; padding:1rem; }
        .modal-card { background:#fff; border-radius:16px; max-width:600px; width:100%; box-shadow:0 25px 50px rgba(0,0,0,0.3); overflow:hidden; }
        .modal-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-bottom:1px solid #e2eeec; }
        .modal-header h3 { font-weight:800; color:#1a1a1a; }
        .modal-close { background:none; border:none; font-size:1.5rem; cursor:pointer; color:#888; line-height:1; }
        .modal-body img { width:100%; display:block; max-height:500px; object-fit:contain; }
        .modal-link { padding:0.75rem 1.25rem; text-align:center; }
        .modal-link a { color:#2a9d8f; font-weight:700; }
        .reject-modal-body { padding:1.25rem; }
        .reject-modal-body label { font-weight:700; color:#333; display:block; margin-bottom:0.5rem; }
        .reject-modal-body textarea { width:100%; padding:0.75rem; border:1.5px solid #e2eeec; border-radius:8px; font-size:0.9rem; resize:vertical; font-family:'Inter',sans-serif; outline:none; box-sizing:border-box; }
        .reject-modal-footer { display:flex; gap:0.75rem; justify-content:flex-end; padding:0.75rem 1.25rem; border-top:1px solid #e2eeec; }
        .btn-cancel { padding:0.6rem 1.2rem; border-radius:8px; background:#f0f4f3; color:#666; border:none; font-weight:700; cursor:pointer; }
        .metrics-row { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:1rem; margin-bottom:1.5rem; }
        .metric-card { background:#fff; border-radius:12px; padding:1rem 1.25rem; border:1.5px solid #e2eeec; text-align:center; }
        .metric-value { font-size:2rem; font-weight:800; color:#2a9d8f; }
        .metric-label { font-size:0.78rem; color:#888; font-weight:600; margin-top:2px; }
        .metric-pending .metric-value { color:#d97706; }
        .metric-approved .metric-value { color:#059669; }
        .metric-rejected .metric-value { color:#dc2626; }
        .btn-delete-mini { padding:0.3rem 0.65rem; border-radius:6px; background:#fff0f0; color:#dc2626; border:1.5px solid #fecaca; font-size:0.8rem; cursor:pointer; transition:all 0.2s; }
        .btn-delete-mini:hover:not(:disabled) { background:#fee2e2; border-color:#dc2626; }
        .admin-bulk-bar { display:flex; align-items:center; gap:0.75rem; background:#fff3cd; border:1.5px solid #fde68a; border-radius:12px; padding:0.75rem 1.25rem; margin-bottom:1rem; flex-wrap:wrap; }
        .admin-select-row { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem; flex-wrap:wrap; }
        .admin-select-all-btn { padding:0.45rem 1rem; border-radius:9px; background:#f0f4f3; color:#555; border:1.5px solid #e2eeec; font-weight:700; font-size:0.8rem; cursor:pointer; white-space:nowrap; }
        .arc-checkbox { width:17px; height:17px; cursor:pointer; accent-color:#2a9d8f; flex-shrink:0; }
      `}</style>

        {/* HEADER */}
        <div className="dashboard-header" style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem'}}>
          <div>
            <h1 className="dashboard-title">🛠️ Admin Panel</h1>
            <p className="dashboard-subtitle">Review submissions and track environmental impact.</p>
          </div>
          <button onClick={fetchActivities} disabled={loading} className="btn btn-primary">{loading ? 'Refreshing...' : '🔄 Refresh'}</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* METRICS */}
        <div className="metrics-row">
          <div className="metric-card"><div className="metric-value">{activities.length}</div><div className="metric-label">Total Activities</div></div>
          <div className="metric-card metric-pending"><div className="metric-value">{pendingCount}</div><div className="metric-label">Pending Review</div></div>
          <div className="metric-card metric-approved"><div className="metric-value">{activities.filter(a => a.status === 'APPROVED').length}</div><div className="metric-label">Approved</div></div>
          <div className="metric-card metric-rejected"><div className="metric-value">{activities.filter(a => a.status === 'REJECTED').length}</div><div className="metric-label">Rejected</div></div>
        </div>

        {/* MAIN TABS */}
        <div className="admin-main-tabs">
          <button className={`admin-main-tab ${mainTab === 'activities' ? 'active' : ''}`} onClick={() => setMainTab('activities')}>📋 Activities</button>
          <button className={`admin-main-tab ${mainTab === 'analytics' ? 'active' : ''}`} onClick={() => setMainTab('analytics')}>📊 Analytics</button>
        </div>

        {/* ANALYTICS TAB */}
        {mainTab === 'analytics' && <AnalyticsEngine activities={activities} />}

        {/* ACTIVITIES TAB */}
        {mainTab === 'activities' && (
            <>
              <div className="admin-cat-tabs">
                <button className={`cat-tab ${categoryTab === 'ALL' ? 'active' : ''}`} onClick={() => setCategoryTab('ALL')}>
                  <span>📋</span>All Activities<span className="cat-tab-count">{activities.length}</span>
                </button>
                {CATEGORIES.map(cat => (
                    <button key={cat.key} className={`cat-tab ${categoryTab === cat.key ? 'active' : ''}`} onClick={() => setCategoryTab(cat.key)}>
                      <span>{cat.icon}</span>{cat.label}<span className="cat-tab-count">{countByCategory(cat.key)}</span>
                    </button>
                ))}
              </div>

              <div className="status-filters">
                {['ALL','PROOF_SUBMITTED','APPROVED','REJECTED'].map(status => (
                    <button key={status} className={`status-filter-btn ${statusFilter === status ? 'active' : ''}`} onClick={() => setStatusFilter(status)}>
                      {status === 'ALL' ? 'All Statuses' : STATUS_STYLES[status]?.label || status}
                      {status !== 'ALL' && <span style={{marginLeft:'4px', opacity:0.7}}>({activities.filter(a => a.status === status && matchesCategory(a)).length})</span>}
                    </button>
                ))}
              </div>

              {!loading && filteredActivities.length > 0 && (
                  <div className="admin-select-row">
                    <button className="admin-select-all-btn" onClick={toggleAdminAll}>
                      {adminSelected.size === filteredActivities.length ? `☐ Deselect All (${filteredActivities.length})` : `☑ Select All (${filteredActivities.length})`}
                    </button>
                    {adminSelected.size > 0 && <span style={{fontSize:'0.82rem', color:'#d97706', fontWeight:700}}>{adminSelected.size} selected</span>}
                  </div>
              )}

              {adminSelected.size > 0 && (
                  <div className="admin-bulk-bar">
                    <div style={{fontWeight:800, fontSize:'0.9rem', color:'#92400e', flex:1}}>🗂️ {adminSelected.size} activit{adminSelected.size===1?'y':'ies'} selected</div>
                    <button style={{padding:'0.5rem 1rem', borderRadius:'9px', background:'#f0f4f3', color:'#555', border:'1.5px solid #e2eeec', fontWeight:700, fontSize:'0.8rem', cursor:'pointer'}} onClick={() => setAdminSelected(new Set())}>Clear</button>
                    <button className="btn-reject-new" style={{padding:'0.5rem 1.2rem'}} onClick={() => setAdminBulkModal(true)} disabled={adminBulkLoading}>🗑️ Delete {adminSelected.size}</button>
                  </div>
              )}

              {loading ? (
                  <div className="page-state">Loading activities...</div>
              ) : filteredActivities.length === 0 ? (
                  <div className="card" style={{padding:'2rem', textAlign:'center', color:'#888'}}>
                    <div style={{fontSize:'3rem', marginBottom:'0.5rem'}}>{categoryTab === 'TREE_PLANTATION' ? '🌳' : categoryTab === 'PUBLIC_TRANSPORT' ? '🚌' : categoryTab === 'RECYCLING' ? '♻️' : '📋'}</div>
                    <div style={{fontWeight:'700', color:'#333'}}>No activities found</div>
                  </div>
              ) : (
                  <div className="activity-cards">
                    {filteredActivities.map((activity, idx) => {
                      const statusStyle = STATUS_STYLES[activity.status] || STATUS_STYLES.PENDING;
                      const isActionLoading = actionLoading === activity.id;
                      const proofSrc = getProofImageSrc(activity.proofImage);
                      const mapLink = getMapLink(activity.latitude, activity.longitude);
                      const catInfo = CATEGORIES.find(c => (activity.activityType || '').toUpperCase().replace(/ /g, '_').includes(c.key));

                      return (
                          <div key={activity.id ?? `activity-${idx}`} className="activity-review-card">
                            <div className="arc-header">
                              <div className="arc-header-left">
                                <span style={{fontSize:'1.5rem'}}>{catInfo?.icon || '📋'}</span>
                                <div>
                                  <div className="arc-type">{catInfo?.label || activity.activityType || 'Activity'}</div>
                                  <div style={{marginTop:2}}>
                                    <div style={{fontSize:'0.82rem', color:'#444', fontWeight:600}}>
                                      👤 {activity.userName || activity.userUsername || activity.user?.username || 'Unknown'}
                                      {activity.userUsername && activity.userName && <span style={{color:'#999', marginLeft:'0.3rem'}}>@{activity.userUsername}</span>}
                                    </div>
                                    {(activity.userEmail || activity.user?.email) && <div style={{fontSize:'0.78rem', color:'#888'}}>✉️ {activity.userEmail || activity.user?.email}</div>}
                                  </div>
                                </div>
                              </div>
                              <div style={{display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', justifyContent:'flex-end'}}>
                                <input type="checkbox" className="arc-checkbox" checked={adminSelected.has(activity.id)} onChange={() => toggleAdminOne(activity.id)} onClick={e => e.stopPropagation()} />
                                <span style={{fontFamily:'monospace', background:'#f0f4f3', padding:'0.2rem 0.55rem', borderRadius:'6px', border:'1px solid #e2eeec', fontSize:'0.78rem', color:'#555', fontWeight:'700'}}>#{activity.id}</span>
                                <span className="arc-status" style={{background:statusStyle.bg, color:statusStyle.color}}>{statusStyle.label}</span>
                                <button className="btn-delete-mini" onClick={() => setDeleteModal(activity.id)} disabled={isActionLoading}>🗑️</button>
                              </div>
                            </div>

                            <div className="arc-body">
                              <div className="arc-info">
                                <div className="arc-info-grid">
                                  <div><div className="arc-info-label">Quantity</div><div className="arc-info-value">{activity.quantity ?? activity.declaredQuantity ?? '-'} {catInfo?.unit || ''}</div></div>
                                  <div><div className="arc-info-label">Points</div><div className="arc-info-value" style={{color:'#2a9d8f'}}>{activity.carbonPoints || activity.points || 0} pts</div></div>
                                  <div><div className="arc-info-label">Submitted</div><div className="arc-info-value" style={{fontSize:'0.8rem'}}>{formatDate(activity.createdAt || activity.date)}</div></div>
                                  {mapLink && <div><div className="arc-info-label">Location</div><div className="arc-info-value" style={{fontSize:'0.8rem'}}><a href={mapLink} target="_blank" rel="noreferrer" style={{color:'#2a9d8f', fontWeight:'700'}}>📍 View on Map</a></div></div>}
                                </div>
                                {activity.description && <div style={{fontSize:'0.82rem', color:'#666', background:'#f8fffe', padding:'0.6rem 0.75rem', borderRadius:'8px', border:'1px solid #e2eeec'}}>💬 {activity.description}</div>}
                                {activity.status === 'REJECTED' && activity.rejectionReason && <div style={{background:'#fee2e2', color:'#dc2626', fontSize:'0.78rem', padding:'0.3rem 0.75rem', borderRadius:'8px', fontWeight:600, marginTop:'0.5rem'}}>❌ {activity.rejectionReason}</div>}
                              </div>
                              <div className="arc-photos">
                                <div className="arc-photos-title">📸 Proof Photos</div>
                                {proofSrc ? (
                                    <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                                      <img src={proofSrc} alt="Proof" className="arc-photo-thumb" onClick={() => setPreview({src:proofSrc, mapLink})} />
                                    </div>
                                ) : <div style={{fontSize:'0.82rem', color:'#aaa'}}>No photos submitted yet</div>}
                              </div>
                            </div>

                            <div className="arc-footer">
                              <div style={{fontSize:'0.8rem', color:'#888'}}>{mapLink ? `📍 ${activity.latitude?.toFixed(4)}, ${activity.longitude?.toFixed(4)}` : 'No GPS data'}</div>
                              <div className="arc-actions">
                                {(activity.status === 'PENDING' || activity.status === 'PROOF_SUBMITTED') ? (
                                    <>
                                      <button className="btn-approve-new" onClick={() => handleApprove(activity.id)} disabled={isActionLoading}>{isActionLoading ? '...' : '✓ Approve'}</button>
                                      <button className="btn-reject-new" onClick={() => { setRejectModal(activity.id); setRejectReason(''); }} disabled={isActionLoading}>✕ Reject</button>
                                    </>
                                ) : (
                                    <span style={{fontSize:'0.82rem', color:'#aaa'}}>{activity.status === 'APPROVED' ? '✓ Approved' : activity.status === 'REJECTED' ? '✕ Rejected' : '-'}</span>
                                )}
                              </div>
                            </div>
                          </div>
                      );
                    })}
                  </div>
              )}
            </>
        )}

        {/* PHOTO PREVIEW MODAL */}
        {preview && (
            <div className="modal-overlay" onClick={() => setPreview(null)}>
              <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>📸 Proof Photo</h3><button className="modal-close" onClick={() => setPreview(null)}>×</button></div>
                <div className="modal-body"><img src={preview.src} alt="Proof" /></div>
                {preview.mapLink && <div className="modal-link"><a href={preview.mapLink} target="_blank" rel="noreferrer">📍 View on Google Maps</a></div>}
              </div>
            </div>
        )}

        {/* REJECT MODAL */}
        {rejectModal && (
            <div className="modal-overlay" onClick={() => setRejectModal(null)}>
              <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>❌ Reject Activity</h3><button className="modal-close" onClick={() => setRejectModal(null)}>×</button></div>
                <div className="reject-modal-body">
                  <label>Reason for rejection (optional)</label>
                  <textarea rows={4} placeholder="Enter reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                </div>
                <div className="reject-modal-footer">
                  <button className="btn-cancel" onClick={() => setRejectModal(null)}>Cancel</button>
                  <button className="btn-reject-new" onClick={handleRejectSubmit} disabled={actionLoading === rejectModal}>{actionLoading === rejectModal ? 'Rejecting...' : 'Confirm Reject'}</button>
                </div>
              </div>
            </div>
        )}

        {/* DELETE MODAL */}
        {deleteModal && (
            <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
              <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>🗑️ Delete Activity</h3><button className="modal-close" onClick={() => setDeleteModal(null)}>×</button></div>
                <div style={{padding:'1.25rem'}}>
                  <p style={{color:'#333', fontSize:'0.9rem', marginBottom:'0.5rem'}}>Delete <strong>Activity #{deleteModal}</strong>?</p>
                  <p style={{color:'#888', fontSize:'0.82rem'}}>This cannot be undone.</p>
                </div>
                <div className="reject-modal-footer">
                  <button className="btn-cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
                  <button className="btn-reject-new" onClick={handleDeleteConfirm} disabled={actionLoading === deleteModal}>{actionLoading === deleteModal ? 'Deleting...' : '🗑️ Confirm Delete'}</button>
                </div>
              </div>
            </div>
        )}

        {/* BULK DELETE MODAL */}
        {adminBulkModal && (
            <div className="modal-overlay" onClick={() => !adminBulkLoading && setAdminBulkModal(false)}>
              <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>🗑️ Bulk Delete</h3><button className="modal-close" disabled={adminBulkLoading} onClick={() => setAdminBulkModal(false)}>×</button></div>
                <div style={{padding:'1.25rem'}}>
                  <p style={{color:'#333', fontSize:'0.9rem', marginBottom:'0.5rem'}}>Delete <strong>{adminSelected.size} activities</strong>?</p>
                  <p style={{color:'#888', fontSize:'0.82rem'}}>This cannot be undone.</p>
                </div>
                <div className="reject-modal-footer">
                  <button className="btn-cancel" disabled={adminBulkLoading} onClick={() => setAdminBulkModal(false)}>Cancel</button>
                  <button className="btn-reject-new" disabled={adminBulkLoading} onClick={handleAdminBulkDelete}>{adminBulkLoading ? 'Deleting...' : `🗑️ Delete ${adminSelected.size}`}</button>
                </div>
              </div>
            </div>
        )}

        <div style={{marginTop:'1rem'}}>
          <button onClick={fetchActivities} disabled={loading} className="btn btn-primary">{loading ? 'Refreshing...' : '🔄 Refresh'}</button>
        </div>
      </div>
  );
};

export default Admin;
