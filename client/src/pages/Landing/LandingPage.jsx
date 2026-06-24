import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileStack, TrendingUp, ArrowRight, Play, Sparkles } from 'lucide-react';
import TaskSphereLogo from '../../components/TaskSphereLogo';
import Interactive3DTilt from '../../components/Interactive3DTilt';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  useDroppable,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const HERO_WORDS = [
  "Secure boundaries.",
  "Scoped team spaces.",
  "Immutable audit logs.",
  "High-velocity metrics."
];

// Mock tasks for sandbox simulation
const INITIAL_SANDBOX_TASKS = [
  { id: '1', title: 'Design premium dark layout', status: 'todo', priority: 'high' },
  { id: '2', title: 'Setup Mongoose collections', status: 'in-progress', priority: 'medium' },
  { id: '3', title: 'Configure express-rate-limit', status: 'done', priority: 'low' },
  { id: '4', title: 'Refactor client-side state', status: 'todo', priority: 'medium' },
];

const CONTAINER_VARIANTS = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12
    }
  }
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 85,
      damping: 14
    }
  }
};

function SortableSandboxTaskCard({ task, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sandbox-task-card priority--${task.priority === 'low' ? 'low' : task.priority === 'high' ? 'high' : 'medium'} ${task.status === 'done' ? 'complete' : ''} ${isDragging ? 'sandbox-task-card--dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="sandbox-task-body">
        <h4>{task.title}</h4>
        <div className="sandbox-task-meta">
          <span className="priority-label">{task.status === 'done' ? 'Done' : task.priority}</span>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="sandbox-task-delete-btn"
            title="Delete task"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}

function SandboxTaskCardOverlay({ task }) {
  return (
    <div className={`sandbox-task-card-overlay priority--${task.priority === 'low' ? 'low' : task.priority === 'high' ? 'high' : 'medium'} ${task.status === 'done' ? 'complete' : ''}`}>
      <div className="sandbox-task-body">
        <h4>{task.title}</h4>
        <div className="sandbox-task-meta">
          <span className="priority-label">{task.status === 'done' ? 'Done' : task.priority}</span>
        </div>
      </div>
    </div>
  );
}

function SandboxColumn({ status, title, tasks, isOver, onDeleteTask }) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const taskIds = tasks.map(t => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`sandbox-column ${isOver ? 'sandbox-column--over' : ''}`}
    >
      <div className="sandbox-col-header">
        <span>{title}</span>
        <span className="sandbox-col-badge">{tasks.length}</span>
      </div>
      <div className="sandbox-task-list">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="sandbox-empty-placeholder"
              style={{ padding: 'var(--space-4) 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-secondary)' }}
            >
              No tasks
            </motion.div>
          ) : (
            tasks.map(task => (
              <SortableSandboxTaskCard
                key={task.id}
                task={task}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function LandingPage() {
  // Typing animation state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  // Sandbox tasks state
  const [tasks, setTasks] = useState(INITIAL_SANDBOX_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);

  // DnD Kit setup for sandbox
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const findColumnForTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.status : null;
  };

  const getTargetColumn = (over) => {
    if (!over) return null;
    const columnIds = ['todo', 'in-progress', 'done'];
    if (columnIds.includes(over.id)) {
      return over.id;
    }
    return findColumnForTask(over.id);
  };

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event) => {
    const targetCol = getTargetColumn(event.over);
    setOverColumnId(targetCol);
  };

  const handleDragEnd = (event) => {
    setActiveTask(null);
    setOverColumnId(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = getTargetColumn(over);
    if (!newStatus) return;

    const activeTaskObj = tasks.find(t => t.id === taskId);
    if (!activeTaskObj) return;

    const activeIndex = tasks.findIndex(t => t.id === taskId);
    const overId = over.id;
    const isOverTask = !['todo', 'in-progress', 'done'].includes(overId);

    setTasks(prevTasks => {
      const updated = prevTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);

      if (isOverTask) {
        const overIndex = updated.findIndex(t => t.id === overId);
        if (activeIndex !== -1 && overIndex !== -1) {
          const result = [...updated];
          const [removed] = result.splice(activeIndex, 1);
          result.splice(overIndex, 0, removed);
          return result;
        }
      }
      return updated;
    });
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverColumnId(null);
  };
  // 1. Typing effect loop
  useEffect(() => {
    let timer;
    const currentWord = HERO_WORDS[currentWordIndex];
    const speed = isDeleting ? 30 : 60;

    if (!isDeleting && displayedText === currentWord) {
      // Pause at full word
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayedText === '') {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % HERO_WORDS.length);
      }, 0);
    } else {
      timer = setTimeout(() => {
        setDisplayedText(
          isDeleting
            ? currentWord.substring(0, displayedText.length - 1)
            : currentWord.substring(0, displayedText.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIndex]);

  // 2. Sandbox functions

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: 'medium'
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Calculations for dynamic sandbox indicators
  const tasksDoneCount = tasks.filter(t => t.status === 'done').length;
  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((tasksDoneCount / totalTasksCount) * 100) : 0;

  return (
    <div className="landing-page-container">
      {/* 1. Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">


          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 70, damping: 13, delay: 0.1 }}
            className="hero-title"
          >
            The command center for <br />
            <span>high-performance teams.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="hero-subtitle"
          >
            TaskSphere coordinates project milestones with{' '}
            <span className="typing-text-wrapper">
              <strong>{displayedText}</strong>
              <span className="typing-cursor">|</span>
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 75, damping: 12, delay: 0.38 }}
            className="hero-actions-container"
          >
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get started <ArrowRight size={16} />
            </Link>
            <a href="#sandbox-section" className="btn btn-secondary btn-lg">
              <Play size={15} /> Try Sandbox
            </a>
          </motion.div>
        </div>

        {/* Floating Mockup Dashboard */}
        <div className="hero-mockup-container">
          <div className="hero-mockup-scaler">
            <motion.div
              initial={{ opacity: 0, y: 60, rotateX: 8 }}
              animate={{
                opacity: 1,
                y: [0, -18, 0],
                rotateX: [2, -1, 2],
                rotateY: [-1, 1, -1],
              }}
              transition={{
                opacity: { duration: 0.8, delay: 0.5 },
                y: {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                rotateX: {
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                rotateY: {
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="hero-mockup-wrapper"
            >
              <Interactive3DTilt maxTilt={12}>
                <div className="hero-mockup-frame">
                  <div className="mockup-header">
                    <div className="mockup-dots">
                      <span className="dot dot--red"></span>
                      <span className="dot dot--yellow"></span>
                      <span className="dot dot--green"></span>
                    </div>
                    <div className="mockup-title">TaskSphere Workspace</div>
                  </div>
                  <div className="mockup-body">
                    {/* Inner Dashboard representation */}
                    <div className="mockup-sidebar">
                      <div className="mockup-sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TaskSphereLogo iconOnly size={16} />
                      </div>
                      <div className="mockup-sidebar-link active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      </div>
                      <div className="mockup-sidebar-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <div className="mockup-sidebar-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
                      </div>
                    </div>
                    <div className="mockup-main">
                      <div className="mockup-metrics">
                        <div className="mockup-card">
                          <div className="mockup-label">Active Workspace</div>
                          <div className="mockup-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                            Product Launch
                          </div>
                        </div>
                        <div className="mockup-card">
                          <div className="mockup-label">Tasks Completed</div>
                          <div className="mockup-value">1,402</div>
                        </div>
                      </div>
                      <div className="mockup-kanban">
                        <div className="mockup-col">
                          <div className="mockup-col-header">
                            <span>To Do</span>
                          </div>
                          <div className="mockup-task border-high">
                            <h5>Refactor API routes</h5>
                            <span className="mockup-task-priority priority-high">High</span>
                          </div>
                          <div className="mockup-task border-medium">
                            <h5>Write documentation</h5>
                            <span className="mockup-task-priority priority-medium">Medium</span>
                          </div>
                        </div>
                        <div className="mockup-col">
                          <div className="mockup-col-header">
                            <span>In Progress</span>
                          </div>
                          <div className="mockup-task border-high">
                            <h5>Setup rate limiting</h5>
                            <span className="mockup-task-priority priority-high">High</span>
                          </div>
                        </div>
                        <div className="mockup-col">
                          <div className="mockup-col-header">
                            <span>Done</span>
                          </div>
                          <div className="mockup-task complete">
                            <h5>Mongoose collections</h5>
                            <span className="mockup-task-priority priority-low">Done</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Interactive3DTilt>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Sandbox Section */}
      <motion.section
        id="sandbox-section"
        className="landing-sandbox"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="section-header">
          <h2 className="section-title">Experience the Interface</h2>
          <p className="section-description">
            Test the interface directly. Click task cards to cycle their status, add new test items, or delete tasks to see metrics adjust instantly.
          </p>
        </div>

        <div className="sandbox-grid">
          {/* Sandbox Controls & Live Metrics */}
          <div className="sandbox-control-card">
            <div className="sandbox-metric-header">
              <h3>Live Sandbox Stats</h3>
              <p>Updates instantly based on your board actions</p>
            </div>

            <div className="sandbox-metrics-row">
              <div className="sandbox-stat">
                <span className="sandbox-stat-value">{totalTasksCount}</span>
                <span className="sandbox-stat-label">Total Sandbox Tasks</span>
              </div>
              <div className="sandbox-stat">
                <span className="sandbox-stat-value">{tasksDoneCount}</span>
                <span className="sandbox-stat-label">Tasks Completed</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="sandbox-progress-container">
              <div className="sandbox-progress-label">
                <span>Completion progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="sandbox-progress-bar-bg">
                <motion.div
                  className="sandbox-progress-bar-fill"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddTask} className="sandbox-add-form">
              <input
                type="text"
                placeholder="Type a task title..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                maxLength={40}
                className="sandbox-input"
              />
              <button type="submit" className="btn btn-secondary btn-sm">
                Add Task
              </button>
            </form>
          </div>

          {/* Interactive Kanban Simulation */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="sandbox-board">
              <SandboxColumn
                status="todo"
                title="To Do"
                tasks={tasks.filter(t => t.status === 'todo')}
                isOver={overColumnId === 'todo'}
                onDeleteTask={handleDeleteTask}
              />
              <SandboxColumn
                status="in-progress"
                title="In Progress"
                tasks={tasks.filter(t => t.status === 'in-progress')}
                isOver={overColumnId === 'in-progress'}
                onDeleteTask={handleDeleteTask}
              />
              <SandboxColumn
                status="done"
                title="Done"
                tasks={tasks.filter(t => t.status === 'done')}
                isOver={overColumnId === 'done'}
                onDeleteTask={handleDeleteTask}
              />
            </div>

            <DragOverlay>
              {activeTask ? (
                <SandboxTaskCardOverlay task={activeTask} />
              ) : null}
            </DragOverlay>
          </DndContext>

        </div>
      </motion.section>

      {/* 3. Product Value Proposition (Features Grid) */}
      <motion.section
        className="landing-features"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="section-header">
          <h2 className="section-title">Designed for operational clarity.</h2>
          <p className="section-description">
            TaskSphere maps the boundaries of complex work, providing security, stability, and reliable progress metrics.
          </p>
        </div>

        <motion.div
          className="features-grid"
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Card 1: Scoped Spaces */}
          <Interactive3DTilt maxTilt={8}>
            <motion.div
              className="feature-card"
              variants={CARD_VARIANTS}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="feature-icon"><ShieldCheck size={26} strokeWidth={1.8} /></div>
              <h3 style={{ transform: 'translateZ(25px)' }}>Scoped Privacy Boundaries</h3>
              <p style={{ transform: 'translateZ(15px)' }}>
                Managers only see managed teams, and members only see assigned cards. TaskSphere ensures strict information boundaries by default.
              </p>
            </motion.div>
          </Interactive3DTilt>

          {/* Card 2: Relational Audits */}
          <Interactive3DTilt maxTilt={8}>
            <motion.div
              className="feature-card"
              variants={CARD_VARIANTS}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="feature-icon"><FileStack size={26} strokeWidth={1.8} /></div>
              <h3 style={{ transform: 'translateZ(25px)' }}>Relational Audit Logs</h3>
              <p style={{ transform: 'translateZ(15px)' }}>
                Every card transition, priority reassignment, and status update is logged immutably in a relational database for audit compliance.
              </p>
            </motion.div>
          </Interactive3DTilt>

          {/* Card 3: Metrics Dashboard */}
          <Interactive3DTilt maxTilt={8}>
            <motion.div
              className="feature-card"
              variants={CARD_VARIANTS}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="feature-icon"><TrendingUp size={26} strokeWidth={1.8} /></div>
              <h3 style={{ transform: 'translateZ(25px)' }}>Advanced Manager Metrics</h3>
              <p style={{ transform: 'translateZ(15px)' }}>
                Monitor team capacity, track overdue ratios, and download customized audit reports as CSV files instantly.
              </p>
            </motion.div>
          </Interactive3DTilt>
        </motion.div>
      </motion.section>

      {/* 4. Final CTA */}
      <motion.section
        className="landing-cta"
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="landing-cta-content">
          <h2>Streamline your team's workflow today.</h2>
          <p>Get started with TaskSphere today. No credit card required.</p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            <Sparkles size={16} /> Create account
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
