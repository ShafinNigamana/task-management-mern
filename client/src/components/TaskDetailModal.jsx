import { useState } from 'react';
import { updateTask, deleteTask } from '../services/taskService';
import { useAuth } from '../context/AuthContext';

function TaskDetailModal({ task: initialTask, team, onClose, onUpdate }) {
  const { user } = useAuth();
  const [task, setTask] = useState(initialTask);
  const [editForm, setEditForm] = useState({
    title: initialTask.title || '',
    description: initialTask.description || '',
    assigneeId: initialTask.assigneeId?._id || initialTask.assigneeId || '',
    status: initialTask.status || 'todo',
    priority: initialTask.priority || 'medium',
    dueDate: initialTask.dueDate ? new Date(initialTask.dueDate).toISOString().split('T')[0] : '',
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const isMemberOrManager = 
    team.managerId?._id === user?._id || 
    team.managerId === user?._id ||
    team.members?.some(m => m === user?._id || m._id === user?._id);

  const canDelete = user?.role === 'manager' && isMemberOrManager;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!isMemberOrManager) return;
    try {
      setSaving(true);
      setSaveError(null);
      
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        assigneeId: editForm.assigneeId || undefined,
        status: editForm.status,
        priority: editForm.priority,
        dueDate: editForm.dueDate || undefined,
      };

      const updated = await updateTask(task._id, payload);
      setTask(updated);
      onUpdate();
      onClose();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!canDelete) return;
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setSaving(true);
      await deleteTask(task._id);
      onUpdate();
      onClose();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to delete task.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Task Details</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSaveTask} className="auth-form" style={{ gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="editTitle">Title</label>
            <input
              type="text"
              id="editTitle"
              name="title"
              value={editForm.title}
              onChange={handleFormChange}
              className="form-input"
              disabled={!isMemberOrManager || saving}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="editDescription">Description</label>
            <textarea
              id="editDescription"
              name="description"
              value={editForm.description}
              onChange={handleFormChange}
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical' }}
              disabled={!isMemberOrManager || saving}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="editStatus">Status</label>
              <select
                id="editStatus"
                name="status"
                value={editForm.status}
                onChange={handleFormChange}
                className="form-select"
                disabled={!isMemberOrManager || saving}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="editPriority">Priority</label>
              <select
                id="editPriority"
                name="priority"
                value={editForm.priority}
                onChange={handleFormChange}
                className="form-select"
                disabled={!isMemberOrManager || saving}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="editAssignee">Assignee</label>
              <select
                id="editAssignee"
                name="assigneeId"
                value={editForm.assigneeId}
                onChange={handleFormChange}
                className="form-select"
                disabled={!isMemberOrManager || saving}
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

            <div className="form-group">
              <label className="form-label" htmlFor="editDueDate">Due Date</label>
              <input
                type="date"
                id="editDueDate"
                name="dueDate"
                value={editForm.dueDate}
                onChange={handleFormChange}
                className="form-input"
                disabled={!isMemberOrManager || saving}
              />
            </div>
          </div>

          {saveError && <div className="auth-error">{saveError}</div>}
          {!isMemberOrManager && (
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
              * You are viewing this task in read-only mode because you do not belong to this team.
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: 'var(--space-4)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Close
            </button>
            {isMemberOrManager && (
              <button type="submit" className="btn-primary" disabled={saving}>
                Save Changes
              </button>
            )}
            {canDelete && (
              <button type="button" className="btn-danger" onClick={handleDeleteTask} disabled={saving}>
                Delete Task
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskDetailModal;
