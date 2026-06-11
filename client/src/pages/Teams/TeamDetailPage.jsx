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

// Column definitions — maps to Task model status enum
const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

// ─── Helpers ───────────────────────────────────────────────

function getInitials(task) {
  // No assignee data populated in current model, show "U"
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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);

  // Track if this is the first load (show full loading) vs polling
  const hasLoadedOnce = useRef(false);

  // ── Data fetching ──

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasksByTeam(teamId);
      setTasks(data);
      setError(null);
      hasLoadedOnce.current = true;
    } catch (err) {
      // Only show error if first load fails
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

  // ── Drag and drop ──

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Find which column a task belongs to
  function findColumnForTask(taskId) {
    const task = tasks.find((t) => t._id === taskId);
    return task ? task.status : null;
  }

  // Determine the drop target column from the over object
  function getTargetColumn(over) {
    if (!over) return null;

    // Check if dropped directly on a column ID
    const columnIds = COLUMNS.map((c) => c.id);
    if (columnIds.includes(over.id)) {
      return over.id;
    }

    // Otherwise it's a task — find which column that task is in
    return findColumnForTask(over.id);
  }

  function handleDragStart(event) {
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragOver(event) {
    const targetCol = getTargetColumn(event.over);
    setOverColumnId(targetCol);
  }

  async function handleDragEnd(event) {
    setActiveTask(null);
    setOverColumnId(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = getTargetColumn(over);

    if (!newStatus) return;

    const currentStatus = findColumnForTask(taskId);
    if (currentStatus === newStatus) return;

    // Update local state immediately
    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId ? { ...t, status: newStatus } : t
      )
    );

    // Persist to backend via PATCH
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, status: currentStatus } : t
        )
      );
    }
  }

  function handleDragCancel() {
    setActiveTask(null);
    setOverColumnId(null);
  }

  // ── Group tasks by status ──

  function getTasksForColumn(columnId) {
    return tasks.filter((t) => t.status === columnId);
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
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} across {COLUMNS.length} columns
        </p>
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
    </div>
  );
}

export default TeamDetailPage;
