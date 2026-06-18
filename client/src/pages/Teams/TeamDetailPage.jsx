import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getTasksByTeam, updateTaskStatus, createTask } from '../../services/taskService';
import { getTeams, updateTeam } from '../../services/teamService';
import { searchUsers } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import ActivityFeed from '../../components/ActivityFeed';
import TaskDetailModal from '../../components/TaskDetailModal';

// Column definitions — maps to Task model status enum
const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

// Filter definitions
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'my-tasks', label: 'My Tasks' },
  { id: 'high-priority', label: 'High Priority' },
  { id: 'overdue', label: 'Overdue' },
];

// ─── Helpers ───────────────────────────────────────────────

function getInitials(task) {
  if (task.assigneeId && typeof task.assigneeId === 'object' && task.assigneeId.name) {
    return task.assigneeId.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return 'UN';
}

function formatDueDate(dateString) {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function getPriorityClass(priority) {
  if (priority === 'high') return 'kanban-badge--priority kanban-badge--priority-high';
  if (priority === 'low') return 'kanban-badge--priority kanban-badge--priority-low';
  return 'kanban-badge--priority';
}

function isOverdue(task) {
  if (!task.dueDate) return false;
  if (task.status === 'done') return false;
  return new Date(task.dueDate) < new Date();
}

// ─── TaskCard (rendered inside SortableContext) ────────────

function SortableTaskCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'kanban-card--dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <TaskCardContent task={task} />
    </div>
  );
}

// ─── TaskCardContent (shared between card and overlay) ─────

function TaskCardContent({ task }) {
  return (
    <>
      <div className="kanban-card-top">
        <div className="kanban-card-avatar">{getInitials(task)}</div>
        <p className="kanban-card-title">{task.title}</p>
      </div>
      <div className="kanban-card-badges">
        <span className={`kanban-badge ${getPriorityClass(task.priority)}`}>
          {task.priority || 'medium'}
        </span>
        <span className="kanban-badge kanban-badge--date">
          {formatDueDate(task.dueDate)}
        </span>
      </div>
    </>
  );
}

// ─── KanbanColumn ──────────────────────────────────────────

function KanbanColumn({ column, tasks, isOver, onCardClick }) {
  const taskIds = tasks.map((t) => t._id);

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}>
      <div className="kanban-column-header">
        <span className="kanban-column-title">{column.title}</span>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="kanban-column-body">
          {tasks.length === 0 ? (
            <div className="kanban-column-empty">No tasks</div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task._id} task={task} onClick={() => onCardClick(task)} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────

function TeamDetailPage() {
  const { id: teamId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Task details modal state
  const [selectedTask, setSelectedTask] = useState(null);

  // Team member management states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberModalError, setMemberModalError] = useState(null);

  // Task creation states
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  });
  const [taskModalError, setTaskModalError] = useState(null);

  // Track loading + dragging state for polling control
  const hasLoadedOnce = useRef(false);
  const isDragging = useRef(false);

  // Reset state on teamId changes during render (Standard React Prop Reset pattern)
  const [prevTeamId, setPrevTeamId] = useState(teamId);
  if (teamId !== prevTeamId) {
    setPrevTeamId(teamId);
    setLoading(true);
    setError(null);
    setSelectedTask(null);
    setTeam(null);
  }

  // Reset loaded tracker on team changes inside effect to avoid ref-in-render violations
  useEffect(() => {
    hasLoadedOnce.current = false;
  }, [teamId]);

  // ── Data fetching ──

  const fetchTeamDetails = useCallback(async () => {
    try {
      const teams = await getTeams();
      const currentTeam = teams.find((t) => t._id === teamId);
      if (!currentTeam) {
        setError("Access Denied: You do not belong to this team");
        setTeam(null);
        setLoading(false);
        return;
      }
      setTeam(currentTeam);
      setSelectedMembers(currentTeam.members || []);
    } catch {
      setError("Failed to load team details");
    }
  }, [teamId]);

  const fetchTasks = useCallback(async () => {
    // Skip polling refresh while user is dragging to avoid state conflicts
    if (isDragging.current) return;

    try {
      const data = await getTasksByTeam(teamId);
      setTasks(data);
      hasLoadedOnce.current = true;
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access Denied: You do not belong to this team");
      } else if (!hasLoadedOnce.current) {
        setError("Failed to load board.");
      }
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Initial fetch + 5-second polling (No synchronous state setting in the effect)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeamDetails();
    fetchTasks();

    const interval = setInterval(() => {
      fetchTeamDetails();
      fetchTasks();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTeamDetails, fetchTasks]);

  // ── Filtering ──

  function applyFilter(allTasks) {
    switch (activeFilter) {
      case 'my-tasks':
        return user?._id
          ? allTasks.filter((t) => {
              const assigneeIdStr = t.assigneeId && typeof t.assigneeId === 'object'
                ? t.assigneeId._id
                : t.assigneeId;
              return assigneeIdStr === user._id;
            })
          : allTasks;
      case 'high-priority':
        return allTasks.filter((t) => t.priority === 'high');
      case 'overdue':
        return allTasks.filter((t) => isOverdue(t));
      default:
        return allTasks;
    }
  }

  const filteredTasks = applyFilter(tasks);

  // ── Member Search Drawer effect with debouncing ──

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(searchQuery);
        const filtered = users.filter(
          (u) => !selectedMembers.some((sm) => sm._id === u._id)
        );
        setSearchResults(filtered);
      } catch {
        // Fail silently
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedMembers]);

  const handleAddMember = (member) => {
    setSelectedMembers((prev) => [...prev, member]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMember = (memberId) => {
    setSelectedMembers((prev) => prev.filter((m) => m._id !== memberId));
  };

  const handleUpdateRoster = async (e) => {
    e.preventDefault();
    try {
      setMemberModalError(null);
      await updateTeam(teamId, {
        name: team.name,
        members: selectedMembers.map((m) => m._id),
      });
      setShowMemberModal(false);
      fetchTeamDetails();
    } catch (err) {
      setMemberModalError(err.response?.data?.message || 'Failed to update roster.');
    }
  };

  // ── Task Creation Submission ──

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      setTaskModalError(null);
      setLoading(true);
      await createTask({
        ...taskForm,
        teamId,
      });
      closeCreateTaskModal();
      fetchTasks();
    } catch (err) {
      setTaskModalError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  const closeCreateTaskModal = () => {
    setShowCreateTaskModal(false);
    setTaskForm({
      title: '',
      description: '',
      assigneeId: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
    });
    setTaskModalError(null);
  };

  // ── Drag and drop ──

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function findColumnForTask(taskId) {
    const task = tasks.find((t) => t._id === taskId);
    return task ? task.status : null;
  }

  function getTargetColumn(over) {
    if (!over) return null;

    const columnIds = COLUMNS.map((c) => c.id);
    if (columnIds.includes(over.id)) {
      return over.id;
    }

    return findColumnForTask(over.id);
  }

  // Auth helper: checks if user is manager/member of current team
  const isMemberOrManager = team && (
    team.managerId?._id === user?._id ||
    team.managerId === user?._id ||
    team.members?.some(m => m === user?._id || m._id === user?._id)
  );

  function handleDragStart(event) {
    if (!isMemberOrManager) return; // Prevent drag if not in team
    isDragging.current = true;
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragOver(event) {
    if (!isMemberOrManager) return;
    const targetCol = getTargetColumn(event.over);
    setOverColumnId(targetCol);
  }

  async function handleDragEnd(event) {
    if (!isMemberOrManager) return;
    isDragging.current = false;
    setActiveTask(null);
    setOverColumnId(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = getTargetColumn(over);

    if (!newStatus) return;

    const currentStatus = findColumnForTask(taskId);
    if (currentStatus === newStatus) return;

    // Optimistic update — move card immediately
    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId ? { ...t, status: newStatus } : t
      )
    );

    // Persist to backend via PATCH
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch {
      // Rollback — restore previous status on failure
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, status: currentStatus } : t
        )
      );
    }
  }

  function handleDragCancel() {
    isDragging.current = false;
    setActiveTask(null);
    setOverColumnId(null);
  }

  // ── Group tasks by status (uses filtered set) ──

  function getTasksForColumn(columnId) {
    return filteredTasks.filter((t) => t.status === columnId);
  }

  // ── Render ──

  if (loading && tasks.length === 0) {
    return (
      <div className="kanban-container">
        <p className="loading-text">Loading board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kanban-container">
        <div className="error-card">{error}</div>
      </div>
    );
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="kanban-title">{team ? team.name : 'Board'}</h1>
            <p className="kanban-subtitle" style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} across {COLUMNS.length} columns
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {user?.role === 'manager' && (
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  if (team) {
                    setSelectedMembers(team.members || []);
                  }
                  setShowMemberModal(true);
                }}
              >
                Manage Members
              </button>
            )}
            {isMemberOrManager && (
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => setShowCreateTaskModal(true)}
              >
                Create Task
              </button>
            )}
          </div>
        </div>
        <div className="kanban-filters" style={{ marginTop: 'var(--space-2)' }}>
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`kanban-chip ${activeFilter === filter.id ? 'kanban-chip--active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="kanban-board">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksForColumn(column.id)}
              isOver={overColumnId === column.id}
              onCardClick={(task) => setSelectedTask(task)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="kanban-card kanban-card-overlay">
              <TaskCardContent task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      <ActivityFeed key={teamId} teamId={teamId} />

      {/* Task Details Modal */}
      {selectedTask && team && (
        <TaskDetailModal
          task={selectedTask}
          team={team}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchTasks}
        />
      )}

      {/* Manage Members Modal */}
      {showMemberModal && team && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Manage Team Members</h2>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setShowMemberModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateRoster} className="auth-form" style={{ gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="memberSearch">Search Members</label>
                <input
                  type="text"
                  id="memberSearch"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search members by name or email..."
                  className="form-input"
                  autoComplete="off"
                />
                {searchResults.length > 0 && (
                  <div className="search-results-list">
                    {searchResults.map((u) => (
                      <div 
                        key={u._id} 
                        className="search-result-item"
                        onClick={() => handleAddMember(u)}
                      >
                        <span className="search-result-name">{u.name}</span>
                        <span className="search-result-email">{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Team Members</label>
                {selectedMembers.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', margin: 0 }}>No members in this team.</p>
                ) : (
                  <div className="selected-members-list">
                    {selectedMembers.map((m) => (
                      <div key={m._id} className="member-pill">
                        <span>{m.name}</span>
                        <button 
                          type="button" 
                          className="member-pill-remove" 
                          onClick={() => handleRemoveMember(m._id)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {memberModalError && <div className="auth-error">{memberModalError}</div>}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowMemberModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Task</h2>
              <button 
                type="button" 
                className="modal-close" 
                onClick={closeCreateTaskModal}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="auth-form" style={{ gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="taskTitle">Title <span style={{ color: 'var(--color-status-todo)' }}>*</span></label>
                <input
                  type="text"
                  id="taskTitle"
                  name="title"
                  value={taskForm.title}
                  onChange={handleTaskFormChange}
                  placeholder="Task title"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  name="description"
                  value={taskForm.description}
                  onChange={handleTaskFormChange}
                  placeholder="Task description..."
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="taskAssignee">Assignee</label>
                <select
                  id="taskAssignee"
                  name="assigneeId"
                  value={taskForm.assigneeId}
                  onChange={handleTaskFormChange}
                  className="form-select"
                >
                  <option value="">Unassigned</option>
                  {team?.managerId && (
                    <option key={team.managerId._id || team.managerId} value={team.managerId._id || team.managerId}>
                      {team.managerId.name ? `${team.managerId.name} (Manager)` : 'Manager'}
                    </option>
                  )}
                  {team?.members?.map((m) => (
                    (m._id !== (team.managerId?._id || team.managerId)) && (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    )
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="taskStatus">Status</label>
                  <select
                    id="taskStatus"
                    name="status"
                    value={taskForm.status}
                    onChange={handleTaskFormChange}
                    className="form-select"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="taskPriority">Priority</label>
                  <select
                    id="taskPriority"
                    name="priority"
                    value={taskForm.priority}
                    onChange={handleTaskFormChange}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="taskDueDate">Due Date</label>
                <input
                  type="date"
                  id="taskDueDate"
                  name="dueDate"
                  value={taskForm.dueDate}
                  onChange={handleTaskFormChange}
                  className="form-input"
                />
              </div>

              {taskModalError && <div className="auth-error">{taskModalError}</div>}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={closeCreateTaskModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamDetailPage;
