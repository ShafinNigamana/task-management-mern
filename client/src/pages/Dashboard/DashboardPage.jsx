import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTeams } from '../../services/teamService';
import { getTasks } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { DashboardSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { Users, LayoutGrid, CheckSquare, Calendar, ArrowRight, Activity, Clock } from 'lucide-react';

function DashboardPage() {
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [teamsData, tasksData] = await Promise.all([
          getTeams(),
          getTasks(),
        ]);
        setTeams(teamsData);
        setTasks(tasksData);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-card">{error}</div>
      </div>
    );
  }

  // Sort tasks by createdAt descending and get the latest 5
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getPriorityBadgeClass = (priority) => {
    const badges = {
      high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
      medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    };
    return badges[priority] || 'bg-zinc-50 text-zinc-700 border-zinc-200';
  };

  const getStatusBadgeClass = (status) => {
    const badges = {
      todo: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-700/50',
      'in-progress': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      done: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
    };
    return badges[status] || 'bg-zinc-100 text-zinc-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculations for additional summary cards
  const myTasksCount = tasks.filter(
    (t) => t.assigneeId === user?._id || t.assigneeId?._id === user?._id
  ).length;

  const overdueCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  ).length;

  const greetingName = user?.name || 'User';

  return (
    <div className="premium-page-wrapper">
      {/* Header */}
      <div className="premium-page-header">
        <div className="premium-page-header-text">
          <h1>Dashboard</h1>
          <p>Welcome back, {greetingName}</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="teams-list-grid mb-10" style={{ marginBottom: 'var(--space-10)' }}>
        {/* Card 1: Total Teams */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card-icon">
            <Users size={56} />
          </div>
          <div className="dashboard-stat-info">
            <span className="dashboard-stat-label">Total Teams</span>
            <span className="dashboard-stat-value">{teams.length}</span>
          </div>
        </div>

        {/* Card 2: Total Tasks */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card-icon">
            <LayoutGrid size={56} />
          </div>
          <div className="dashboard-stat-info">
            <span className="dashboard-stat-label">Total Tasks</span>
            <span className="dashboard-stat-value">{tasks.length}</span>
          </div>
        </div>

        {/* Card 3: My Tasks */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card-icon">
            <CheckSquare size={56} />
          </div>
          <div className="dashboard-stat-info">
            <span className="dashboard-stat-label">My Tasks</span>
            <span className="dashboard-stat-value">{myTasksCount}</span>
          </div>
        </div>

        {/* Card 4: Overdue Tasks */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card-icon">
            <Clock size={56} />
          </div>
          <div className="dashboard-stat-info">
            <span className="dashboard-stat-label">Overdue Tasks</span>
            <span className={`dashboard-stat-value ${overdueCount > 0 ? 'value--danger' : ''}`}>{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Recent Tasks Section */}
      <div className="activity-list-container">
        <h2 className="activity-list-title">
          <Activity size={18} />
          Recent Activity
        </h2>
        {recentTasks.length === 0 ? (
          <EmptyState 
            type="dashboard" 
            title="No tasks yet" 
            description="Tasks from your teams will appear here." 
          />
        ) : (
          <div className="activity-list-items">
            {recentTasks.map((task) => (
              <Link 
                key={task._id} 
                to={`/teams/${task.teamId}`} 
                className="activity-list-item"
              >
                <div className="activity-item-main">
                  <p className="activity-item-title">{task.title}</p>
                  <div className="activity-item-badges">
                    <span className={`badge badge-status-${task.status}`}>
                      {task.status}
                    </span>
                    <span className={`badge badge-priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className="activity-item-right">
                  <span className="activity-item-date">
                    <Calendar size={12} />
                    {formatDate(task.createdAt)}
                  </span>
                  <ArrowRight size={14} className="activity-item-arrow" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
