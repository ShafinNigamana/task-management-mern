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
import { getTasksByTeam, updateTaskStatus } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import ActivityFeed from '../../components/ActivityFeed';

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
  return 'U';
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

function SortableTaskCard({ task }) {
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

function KanbanColumn({ column, tasks, isOver }) {
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
              <SortableTaskCard key={task._id} task={task} />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Track loading + dragging state for polling control
  const hasLoadedOnce = useRef(false);
  const isDragging = useRef(false);

  // ── Data fetching ──

  const fetchTasks = useCallback(async () => {
    // Skip polling refresh while user is dragging to avoid state conflicts
    if (isDragging.current) return;

    try {
      const data = await getTasksByTeam(teamId);
      setTasks(data);
      setError(null);
      hasLoadedOnce.current = true;
    } catch (err) {
      if (!hasLoadedOnce.current) {
        setError('Failed to load board.');
      }
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Initial fetch + 5-second polling
  useEffect(() => {
    setLoading(true);
    setError(null);
    hasLoadedOnce.current = false;
    fetchTasks();

    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // ── Filtering ──

  function applyFilter(allTasks) {
    switch (activeFilter) {
      case 'my-tasks':
        return user?._id
          ? allTasks.filter((t) => t.assigneeId === user._id)
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

  function handleDragStart(event) {
    isDragging.current = true;
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragOver(event) {
    const targetCol = getTargetColumn(event.over);
    setOverColumnId(targetCol);
  }

  async function handleDragEnd(event) {
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
    } catch (err) {
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

  if (loading) {
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
        <h1 className="kanban-title">Board</h1>
        <p className="kanban-subtitle">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} across {COLUMNS.length} columns
        </p>
        <div className="kanban-filters">
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
      <ActivityFeed teamId={teamId} />
    </div>
  );
}

export default TeamDetailPage;
