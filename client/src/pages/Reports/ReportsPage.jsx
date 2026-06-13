import { useEffect, useState } from 'react';
import { getMetrics, exportMetrics } from '../../services/reportService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await getMetrics();
        setMetrics(data);
        setError(null);
      } catch {
        setError('Failed to load report metrics.');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportMetrics();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-metrics-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export report metrics.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="reports-header-wrapper">
          <div className="reports-header">
            <h1 className="reports-title">Reports</h1>
          </div>
        </div>
        <div className="loading-text">Loading report metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-container">
        <div className="reports-header-wrapper">
          <div className="reports-header">
            <h1 className="reports-title">Reports</h1>
          </div>
        </div>
        <div className="error-card">{error}</div>
      </div>
    );
  }

  // Format data for Recharts BarChart (chronological order)
  const chartData = [...(metrics?.tasksClosedPerWeek || [])]
    .reverse()
    .map((item) => ({
      name: `W${item.week.toString().slice(-2)}`,
      'Closed Tasks': item.closed_count,
    }));

  return (
    <div className="reports-container">
      <div className="reports-header-wrapper">
        <div className="reports-header">
          <h1 className="reports-title">Reports</h1>
          <p className="reports-subtitle">System insights and performance overview</p>
        </div>
        <button 
          onClick={handleExport} 
          disabled={exporting}
          className="btn-export"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="reports-grid">
        {/* Section 1: Tasks Closed Per Week */}
        <div className="reports-section">
          <h2 className="reports-section-title">Tasks Closed Per Week</h2>
          {metrics.tasksClosedPerWeek.length === 0 ? (
            <div className="reports-card">
              <span className="reports-card-label" style={{ textTransform: 'none' }}>
                No tasks closed yet.
              </span>
            </div>
          ) : (
            <div className="reports-card" style={{ padding: '20px 16px 10px 16px' }}>
              <div style={{ width: '100%', height: 220, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-border)' }}
                    />
                    <YAxis 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-border-subtle)', opacity: 0.5 }}
                      contentStyle={{ 
                        backgroundColor: 'var(--color-surface)', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        color: 'var(--color-text-primary)'
                      }} 
                    />
                    <Bar dataKey="Closed Tasks" fill="var(--color-text-primary)" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Top Contributors */}
        <div className="reports-section">
          <h2 className="reports-section-title">Top Contributors</h2>
          {metrics.topContributors.length === 0 ? (
            <div className="reports-card">
              <span className="reports-card-label" style={{ textTransform: 'none' }}>
                No active contributors logged.
              </span>
            </div>
          ) : (
            <div className="leaderboard-list">
              {metrics.topContributors.map((item, index) => {
                const rank = index + 1;
                return (
                  <div key={item.actor_id} className="leaderboard-item">
                    <div className="leaderboard-left">
                      <span className={`leaderboard-rank leaderboard-rank--${rank}`}>
                        {rank}
                      </span>
                      <span className="leaderboard-name">{item.name}</span>
                    </div>
                    <span className="leaderboard-actions">{item.actions} actions</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Overdue Rate */}
        <div className="reports-section">
          <h2 className="reports-section-title">Overdue Rate</h2>
          <div className="reports-card-list">
            <div className="reports-card">
              <span className="reports-card-value">{metrics.overdueRate.totalActive}</span>
              <span className="reports-card-label">Total Active Tasks</span>
            </div>
            <div className="reports-card">
              <span className="reports-card-value">{metrics.overdueRate.overdue}</span>
              <span className="reports-card-label">Overdue Tasks</span>
            </div>
            <div className="reports-card">
              <span className="reports-card-value">
                {(metrics.overdueRate.rate * 100).toFixed(1)}%
              </span>
              <span className="reports-card-label">Overdue Percentage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
