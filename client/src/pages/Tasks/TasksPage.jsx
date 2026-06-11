import { useEffect, useState } from 'react';
import { getTasks } from '../../services/taskService';

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        setError('Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      'todo': '#b91c1c',
      'in-progress': '#a16207',
      'done': '#15803d',
    };
    return colors[status] || '#737373';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Loading tasks...</p>
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Tasks</h1>
        <p className="dashboard-subtitle">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} across all teams
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-card">
          <p>No tasks available.</p>
        </div>
      ) : (
        <div className="dashboard-section">
          <h2 className="section-title">All Tasks</h2>
          <div className="tasks-list">
            {tasks.map((task) => (
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
                <p className="task-date">{formatDate(task.dueDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage;
