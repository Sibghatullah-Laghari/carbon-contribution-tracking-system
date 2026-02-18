import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import api from '../../api/axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyProgress = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyPoints, setMonthlyPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    fetchMonthlySummary();
  }, []);

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);
      setError('');
      const currentYear = new Date().getFullYear();
      const res = await api.get(`/api/report/graph?year=${currentYear}`);
      const data = res?.data?.data || res?.data || null;
      setYear(data?.year || currentYear);
      setMonthlyPoints(Array.isArray(data?.monthlyData) ? data.monthlyData : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load monthly data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' })
  );

  const chartData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Carbon Points',
        data: monthlyPoints,
        backgroundColor: 'rgba(42, 157, 143, 0.6)',
        borderColor: 'rgba(42, 157, 143, 1)',
        borderWidth: 2,
        tension: 0.3
      },
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 900,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Carbon Contribution Progress'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const totalPoints = monthlyPoints.reduce((sum, v) => sum + (Number(v) || 0), 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Monthly Progress</h1>
        <p className="dashboard-subtitle">Visualize your carbon contribution over time.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-label">Total Points</div>
          <div className="stat-value stat-positive">
            {totalPoints.toLocaleString()}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Months Tracked</div>
          <div className="stat-value stat-primary">
            {monthlyPoints.length || 12}
          </div>
        </div>
      </div>

      <div className="chart-toolbar">
        <button
          onClick={() => setChartType('bar')}
          className={`toggle-button ${chartType === 'bar' ? 'active' : ''}`}
        >
          Bar Chart
        </button>
        <button
          onClick={() => setChartType('line')}
          className={`toggle-button ${chartType === 'line' ? 'active' : ''}`}
        >
          Line Chart
        </button>
      </div>

      <div className="card section-card chart-card">
        {loading ? (
          <div className="page-state">Loading chart data...</div>
        ) : monthlyPoints.length === 0 ? (
          <div className="page-state">No monthly data available. Start submitting activities!</div>
        ) : (
          <div className="chart-shell">
            {chartType === 'bar' ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        )}
      </div>

      <div className="section-footer">
        <button
          onClick={fetchMonthlySummary}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default MonthlyProgress;
