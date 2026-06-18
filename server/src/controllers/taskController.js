import Task from '../models/Task.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import { logAudit } from '../utils/auditLogger.js';

export const createTask = async (req, res) => {
  try {
    const { title, description, assigneeId, teamId, status, priority, dueDate } = req.body || {};
    
    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!teamId) {
      return res.status(400).json({ message: 'Team ID is required to create a task' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Verify team membership/ownership (manager or member)
    const isAuthorized = team.managerId?.toString() === req.user.id || 
                         team.members.some(m => m.toString() === req.user.id);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden: You do not belong to this team' });
    }

    // Verify if assignee belongs to the team (manager or member)
    if (assigneeId) {
      const isAssigneeInTeam = team.members.some(m => m.toString() === assigneeId) ||
                               team.managerId?.toString() === assigneeId;
      if (!isAssigneeInTeam) {
        return res.status(400).json({ message: 'Assignee must be a member of the team' });
      }
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
    
    // Log audit event
    logAudit('CREATE_TASK', req.user?.id, task._id.toString(), task.teamId ? task.teamId.toString() : null, {
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

    // Scope tasks by team membership
    const dbUser = await User.findById(req.user.id);
    let teamFilter = {};
    if (dbUser?.role === 'manager') {
      teamFilter = { managerId: req.user.id };
    } else {
      teamFilter = { members: req.user.id };
    }

    const userTeams = await Team.find(teamFilter);
    const teamIds = userTeams.map((t) => t._id.toString());

    if (teamId) {
      if (!teamIds.includes(teamId)) {
        return res.status(403).json({ message: "Forbidden: You do not have access to this team's tasks" });
      }
      filter.teamId = teamId;
    } else {
      if (teamIds.length === 0) {
        return res.status(200).json([]);
      }
      filter.teamId = { $in: teamIds };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;

    const tasks = await Task.find(filter).populate('assigneeId', 'name email role');
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

    if (task.teamId) {
      const team = await Team.findById(task.teamId);
      if (team) {
        const isAuthorized = team.managerId?.toString() === req.user.id || 
                             team.members.some(m => m.toString() === req.user.id);
        if (!isAuthorized) {
          return res.status(403).json({ message: 'Forbidden: You do not belong to this team' });
        }
      }
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
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify team membership/ownership for mutation
    if (task.teamId) {
      const team = await Team.findById(task.teamId);
      if (team) {
        const isAuthorized = team.managerId?.toString() === req.user.id || 
                             team.members.some(m => m.toString() === req.user.id);
        if (!isAuthorized) {
          return res.status(403).json({ message: 'Forbidden: You do not belong to this team' });
        }

        // Verify if updates try to assign to a non-member user
        if (updates.assigneeId) {
          const isAssigneeInTeam = team.members.some(m => m.toString() === updates.assigneeId) ||
                                   team.managerId?.toString() === updates.assigneeId;
          if (!isAssigneeInTeam) {
            return res.status(400).json({ message: 'Assignee must be a member of the team' });
          }
        }
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    // Log audit event
    logAudit('UPDATE_TASK', req.user?.id, updatedTask._id.toString(), updatedTask.teamId ? updatedTask.teamId.toString() : null, {
      title: updatedTask.title,
      updatedFields: updates
    });
    
    return res.status(200).json(updatedTask);
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

    // Manager Only check
    if (req.user?.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden: Only managers can delete tasks' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify team membership/ownership for manager
    if (task.teamId) {
      const team = await Team.findById(task.teamId);
      if (team) {
        const isAuthorized = team.managerId?.toString() === req.user.id || 
                             team.members.some(m => m.toString() === req.user.id);
        if (!isAuthorized) {
          return res.status(403).json({ message: 'Forbidden: You do not belong to this team' });
        }
      }
    }
    
    const teamId = task.teamId ? task.teamId.toString() : null;
    const title = task.title;

    await Task.findByIdAndDelete(id);
    
    // Log audit event
    logAudit('DELETE_TASK', req.user?.id, id, teamId, {
      title,
      deletedTaskId: id
    });
    
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};