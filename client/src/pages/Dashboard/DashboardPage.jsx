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
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 leading-none">Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-500">Welcome back, {greetingName}</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Card 1: Total Teams */}
        <div className="group relative overflow-hidden bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-neutral-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Users size={56} className="text-neutral-900" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Total Teams</span>
            <span className="text-3xl font-bold tracking-tight text-neutral-900">{teams.length}</span>
          </div>
        </div>

        {/* Card 2: Total Tasks */}
        <div className="group relative overflow-hidden bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-neutral-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <LayoutGrid size={56} className="text-neutral-900" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Total Tasks</span>
            <span className="text-3xl font-bold tracking-tight text-neutral-900">{tasks.length}</span>
          </div>
        </div>

        {/* Card 3: My Tasks */}
        <div className="group relative overflow-hidden bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-neutral-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <CheckSquare size={56} className="text-neutral-900" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">My Tasks</span>
            <span className="text-3xl font-bold tracking-tight text-neutral-900">{myTasksCount}</span>
          </div>
        </div>

        {/* Card 4: Overdue Tasks */}
        <div className="group relative overflow-hidden bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-neutral-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Clock size={56} className="text-neutral-900" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Overdue Tasks</span>
            <span className={`text-3xl font-bold tracking-tight ${overdueCount > 0 ? 'text-red-600' : 'text-neutral-900'}`}>{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Recent Tasks Section */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <Activity size={18} className="text-neutral-500" />
          Recent Activity
        </h2>
        {recentTasks.length === 0 ? (
          <EmptyState 
            type="dashboard" 
            title="No tasks yet" 
            description="Tasks from your teams will appear here." 
          />
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentTasks.map((task) => (
              <Link 
                key={task._id} 
                to={`/teams/${task.teamId}`} 
                className="flex items-center justify-between py-4 group transition-colors hover:bg-neutral-50/50 px-2 -mx-2 rounded-xl"
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-black">{task.title}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 border rounded-full font-medium ${getStatusBadgeClass(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`px-2 py-0.5 border rounded-full font-medium ${getPriorityBadgeClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-neutral-400">
                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(task.createdAt)}
                  </span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 text-neutral-800" />
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
