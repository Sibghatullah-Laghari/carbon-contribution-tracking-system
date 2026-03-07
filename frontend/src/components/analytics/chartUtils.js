/**
 * Shared analytics constants and helpers.
 * Imported by both Admin.jsx (admin-wide analytics)
 * and MonthlyProgress.jsx (user-scoped analytics).
 * Keep this file side-effect-free and pure.
 */

// ─── Chart colour palette ─────────────────────────────────────
export const CHART_COLORS = {
  tree:      '#16a34a',
  transport: '#2a9d8f',
  recycling: '#7c3aed',
  approved:  '#059669',
  rejected:  '#dc2626',
  pending:   '#d97706',
  points:    '#2a9d8f',
};

export const PIE_COLORS        = ['#16a34a', '#2a9d8f', '#7c3aed', '#f97316'];
export const STATUS_PIE_COLORS = ['#059669', '#dc2626', '#d97706'];

// ─── Month label arrays ───────────────────────────────────────
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Activity helpers ─────────────────────────────────────────

/**
 * Maps an activity to one of: 'tree' | 'transport' | 'recycling' | 'other'
 * Works for both AdminActivityDto (activityType) and raw Activity (activityType).
 */
export const getCatKey = (activity) => {
  const type = (activity.activityType || activity.type || '')
    .toUpperCase()
    .replace(/ /g, '_');
  if (type.includes('TREE'))      return 'tree';
  if (type.includes('TRANSPORT')) return 'transport';
  if (type.includes('RECYCLING')) return 'recycling';
  return 'other';
};

/**
 * Returns a JS Date from an activity's timestamp field,
 * or null if the activity has no date.
 * Handles both 'createdAt' and legacy 'date' field names.
 */
export const getActivityDate = (activity) => {
  const ts = activity.createdAt || activity.date;
  return ts ? new Date(ts) : null;
};

// ─── Date range quick-filter helpers ─────────────────────────

/** Today as YYYY-MM-DD */
export const todayStr = () => new Date().toISOString().slice(0, 10);

/** First day of current year as YYYY-MM-DD */
export const currentYearStart = () => `${new Date().getFullYear()}-01-01`;

/** First day of the current week (Sunday) as YYYY-MM-DD */
export const weekStartStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
};

/** First day of the current month as YYYY-MM-DD */
export const monthStartStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

// ─── Timeline builder ─────────────────────────────────────────

/**
 * Groups a list of activities into time-series buckets based on `granularity`.
 * Each bucket contains counts for each category + status, suitable for
 * recharts BarChart / LineChart / AreaChart with multiple series.
 *
 * @param {Activity[]} activities   - Already filtered by date range
 * @param {'YEAR'|'MONTH'|'DAY'|'HOUR'} granularity
 * @returns {Object[]} Array of { name, Tree Plantation, Public Transport, Recycling, Points, Total, Approved, Rejected }
 */
export const buildTimelineData = (activities, granularity) => {
  const makeEntry = (acts, name) => ({
    name,
    'Tree Plantation': acts.filter(a => getCatKey(a) === 'tree').length,
    'Public Transport': acts.filter(a => getCatKey(a) === 'transport').length,
    'Recycling':        acts.filter(a => getCatKey(a) === 'recycling').length,
    'Points':  acts
      .filter(a => a.status === 'APPROVED')
      .reduce((s, a) => s + (a.points || 0), 0),
    'Total':    acts.length,
    'Approved': acts.filter(a => a.status === 'APPROVED').length,
    'Rejected': acts.filter(a => a.status === 'REJECTED').length,
  });

  if (granularity === 'HOUR') {
    // 24 fixed buckets: aggregate across all days in the range
    return Array.from({ length: 24 }, (_, h) =>
      makeEntry(
        activities.filter(a => { const d = getActivityDate(a); return d && d.getHours() === h; }),
        `${h}:00`,
      ),
    );
  }

  if (granularity === 'DAY') {
    // One bucket per calendar day that has at least one activity
    const days = [
      ...new Set(
        activities
          .map(a => { const d = getActivityDate(a); return d ? d.toISOString().slice(0, 10) : null; })
          .filter(Boolean),
      ),
    ].sort();
    return days.map(day =>
      makeEntry(
        activities.filter(a => {
          const d = getActivityDate(a);
          return d && d.toISOString().slice(0, 10) === day;
        }),
        new Date(day + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short', day: 'numeric',
        }),
      ),
    );
  }

  if (granularity === 'MONTH') {
    // One bucket per calendar month (YYYY-MM) present in the data
    const months = [
      ...new Set(
        activities
          .map(a => {
            const d = getActivityDate(a);
            return d
              ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
              : null;
          })
          .filter(Boolean),
      ),
    ].sort();
    return months.map(ym =>
      makeEntry(
        activities.filter(a => {
          const d = getActivityDate(a);
          if (!d) return false;
          return (
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === ym
          );
        }),
        new Date(ym + '-01').toLocaleDateString('en-US', {
          month: 'short', year: 'numeric',
        }),
      ),
    );
  }

  if (granularity === 'YEAR') {
    // One bucket per calendar year present in the data
    const years = [
      ...new Set(
        activities
          .map(a => { const d = getActivityDate(a); return d ? d.getFullYear() : null; })
          .filter(Boolean),
      ),
    ].sort((a, b) => a - b);
    return years.map(year =>
      makeEntry(
        activities.filter(a => {
          const d = getActivityDate(a);
          return d && d.getFullYear() === year;
        }),
        String(year),
      ),
    );
  }

  return [];
};
