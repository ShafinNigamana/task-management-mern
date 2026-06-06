import { useEffect, useState } from 'react';
import { getTeams } from '../../services/teamService';
import { getTasks } from '../../services/taskService';

function DashboardPage() {
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-card">{error}</div>
      </div>
    );
  }

  // Sort tasks by createdAt descending and get the latest 5
  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getStatusColor = (status) => {
    const colors = {
      'todo': '#ef4444',
      'in-progress': '#f59e0b',
      'done': '#10b981',
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">System overview and metrics</p>
      </div>

      {/* Summary Section */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-content">
            <p className="summary-label">Total Teams</p>
            <p className="summary-value">{teams.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-content">
            <p className="summary-label">Total Tasks</p>
            <p className="summary-value">{tasks.length}</p>
          </div>
        </div>
      </div>

      {/* Recent Tasks Section */}
      <div className="dashboard-section">
        <h2 className="section-title">Recent Tasks</h2>
        {recentTasks.length === 0 ? (
          <div className="empty-card">
            <p>No recent tasks available.</p>
          </div>
        ) : (
          <div className="tasks-list">
            {recentTasks.map((task) => (
              <div key={task._id} className="task-item">
                <div className="task-main">
                  <p className="task-title">{task.title}</p>
                  <div className="task-meta">
                    <span 
                      className="task-status"
                      style={{ color: getStatusColor(task.status) }}
                    >
                      {task.status}
                    </span>
                    <span className="task-priority">{task.priority}</span>
                  </div>
                </div>
                <p className="task-date">{formatDate(task.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
