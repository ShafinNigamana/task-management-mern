import { useEffect, useState } from 'react';
import { getMetrics, exportMetrics } from '../../services/reportService';
import { ReportsSkeleton } from '../../components/Skeleton';
import { BarChart3, FileSpreadsheet, ShieldAlert, Award } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
    return <ReportsSkeleton />;
  }

  if (error) {
    return (
      <div className="premium-page-wrapper">
        <div className="premium-page-header">
          <div className="premium-page-header-text">
            <h1>Reports</h1>
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
    <div className="premium-page-wrapper">
      {/* Header */}
      <div className="premium-page-header">
        <div className="premium-page-header-text">
          <h1>Reports</h1>
          <p>System insights and performance overview</p>
        </div>
        <button 
          onClick={handleExport} 
          disabled={exporting}
          className="btn btn-secondary flex items-center gap-1.5"
          style={{ alignSelf: 'flex-start' }}
        >
          <FileSpreadsheet size={15} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="reports-layout-grid">
        {/* Section 1: Tasks Closed Per Week */}
        <div className="reports-panel-card">
          <h2 className="reports-panel-title">
            <BarChart3 size={18} style={{ color: 'var(--color-text-muted)' }} />
            Tasks Closed Per Week
          </h2>
          {metrics.tasksClosedPerWeek.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)', fontSize: 'var(--text-secondary)' }}>
              No tasks closed yet.
            </div>
          ) : (
            <div style={{ height: '256px', marginTop: 'var(--space-2)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#a3a3a3" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#e5e5e5' }}
                  />
                  <YAxis 
                    stroke="#a3a3a3" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#e5e5e5' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#fafafa', opacity: 0.5 }}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e5e5', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#171717'
                    }} 
                  />
                  <Bar dataKey="Closed Tasks" fill="#171717" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Section 2: Top Contributors */}
        <div className="reports-panel-card">
          <h2 className="reports-panel-title">
            <Award size={18} style={{ color: 'var(--color-text-muted)' }} />
            Top Contributors
          </h2>
          {metrics.topContributors.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)', fontSize: 'var(--text-secondary)' }}>
              No active contributors logged.
            </div>
          ) : (
            <div className="reports-leaderboard">
              {metrics.topContributors.map((item, index) => {
                const rank = index + 1;
                let rankClass = 'rank--other';
                if (rank === 1) rankClass = 'rank--1';
                else if (rank === 2) rankClass = 'rank--2';
                else if (rank === 3) rankClass = 'rank--3';

                return (
                  <div key={item.actor_id} className="reports-leaderboard-row">
                    <div className="reports-leaderboard-left">
                      <span className={`reports-rank-badge ${rankClass}`}>
                        {rank}
                      </span>
                      <span className="reports-leaderboard-name">{item.name}</span>
                    </div>
                    <span className="reports-leaderboard-actions">{item.actions} actions</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Overdue Rate */}
        <div className="reports-panel-card reports-grid-col-span-2">
          <h2 className="reports-panel-title" style={{ marginBottom: 'var(--space-6)' }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-text-muted)' }} />
            Overdue Rate & Task Health
          </h2>
          <div className="reports-stats-card-grid">
            <div className="reports-stat-box">
              <span className="reports-stat-box-value">{metrics.overdueRate.totalActive}</span>
              <span className="reports-stat-box-label">Total Active Tasks</span>
            </div>
            <div className="reports-stat-box">
              <span className="reports-stat-box-value value--danger">{metrics.overdueRate.overdue}</span>
              <span className="reports-stat-box-label">Overdue Tasks</span>
            </div>
            <div className="reports-stat-box">
              <span className="reports-stat-box-value">
                {(metrics.overdueRate.rate * 100).toFixed(1)}%
              </span>
              <span className="reports-stat-box-label">Overdue Percentage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
