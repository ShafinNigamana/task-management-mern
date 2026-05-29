import Task from '../models/Task.js';
import { logAudit } from '../utils/auditLogger.js';

export const createTask = async (req, res) => {
  try {
    const { title, description, assigneeId, teamId, status, priority, dueDate } = req.body || {};
    
    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = await Task.create({
      title,
      description,
      assigneeId,
      teamId,
      status,
      priority,
      dueDate,
    });
    
    // Log audit event asynchronously
    logAudit('CREATE_TASK', req.user?.id, task._id.toString(), {
      title: task.title,
      status: task.status
    });
    
    return res.status(201).json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid task data', error: error.message });
    }
    return res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { status, priority, assigneeId, teamId } = req.query;
    const filter = {};

    // Basic dynamic filtering based on query params
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (teamId) filter.teamId = teamId;

    const tasks = await Task.find(filter);
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    
    const task = await Task.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Log audit event asynchronously
    logAudit('UPDATE_TASK', req.user?.id, task._id.toString(), {
      updatedFields: updates
    });
    
    return res.status(200).json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid task data', error: error.message });
    }
    return res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Log audit event asynchronously
    logAudit('DELETE_TASK', req.user?.id, id, {
      deletedTaskId: id
    });
    
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};