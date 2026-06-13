import Team from '../models/Team.js';
import User from '../models/User.js';

export const createTeam = async (req, res) => {
  try {
    const { name, members } = req.body || {};
    
    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const team = await Team.create({ 
      name, 
      members,
      managerId: req.user?.id 
    });
    return res.status(201).json(team);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid team data', error: error.message });
    }
    return res.status(500).json({ message: 'Error creating team', error: error.message });
  }
};

export const getTeams = async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.id);
    let filter = {};
    if (dbUser?.role === 'manager') {
      filter = {
        $or: [
          { managerId: req.user.id },
          { members: req.user.id }
        ]
      };
    } else {
      filter = { members: req.user?.id };
    }

    const teams = await Team.find(filter)
      .populate('members', 'name email role')
      .populate('managerId', 'name email role');
    return res.status(200).json(teams);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching teams', error: error.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, members } = req.body || {};
    
    const team = await Team.findByIdAndUpdate(
      id,
      { name, members },
      { new: true, runValidators: true }
    );
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    return res.status(200).json(team);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid team data', error: error.message });
    }
    return res.status(500).json({ message: 'Error updating team', error: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findByIdAndDelete(id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    return res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting team', error: error.message });
  }
};
