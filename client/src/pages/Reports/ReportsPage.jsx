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
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 leading-none">Reports</h1>
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
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 leading-none">Reports</h1>
          <p className="mt-2 text-sm text-neutral-500">System insights and performance overview</p>
        </div>
        <button 
          onClick={handleExport} 
          disabled={exporting}
          className="btn btn-secondary flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FileSpreadsheet size={15} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Tasks Closed Per Week */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-neutral-500" />
            Tasks Closed Per Week
          </h2>
          {metrics.tasksClosedPerWeek.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-sm">
              No tasks closed yet.
            </div>
          ) : (
            <div className="h-64 mt-2">
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
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Award size={18} className="text-neutral-500" />
            Top Contributors
          </h2>
          {metrics.topContributors.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-sm">
              No active contributors logged.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 flex-1">
              {metrics.topContributors.map((item, index) => {
                const rank = index + 1;
                return (
                  <div key={item.actor_id} className="flex items-center justify-between py-3.5 px-1">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        rank === 1 ? 'bg-amber-100 text-amber-800' :
                        rank === 2 ? 'bg-zinc-100 text-zinc-800' :
                        rank === 3 ? 'bg-amber-50 text-amber-700' :
                        'bg-neutral-50 text-neutral-500'
                      }`}>
                        {rank}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">{item.name}</span>
                    </div>
                    <span className="text-xs text-neutral-500 font-medium bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-200/45">{item.actions} actions</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Overdue Rate */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <ShieldAlert size={18} className="text-neutral-500" />
            Overdue Rate & Task Health
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-neutral-50/50 border border-neutral-200/60 rounded-xl p-5 text-center transition-all duration-300 hover:border-neutral-300/80">
              <span className="block text-3xl font-extrabold tracking-tight text-neutral-900 mb-1">{metrics.overdueRate.totalActive}</span>
              <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Total Active Tasks</span>
            </div>
            <div className="bg-neutral-50/50 border border-neutral-200/60 rounded-xl p-5 text-center transition-all duration-300 hover:border-neutral-300/80">
              <span className="block text-3xl font-extrabold tracking-tight text-red-600 mb-1">{metrics.overdueRate.overdue}</span>
              <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Overdue Tasks</span>
            </div>
            <div className="bg-neutral-50/50 border border-neutral-200/60 rounded-xl p-5 text-center transition-all duration-300 hover:border-neutral-300/80">
              <span className="block text-3xl font-extrabold tracking-tight text-neutral-900 mb-1">
                {(metrics.overdueRate.rate * 100).toFixed(1)}%
              </span>
              <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Overdue Percentage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
