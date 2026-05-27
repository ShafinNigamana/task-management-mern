import Team from '../models/Team.js';

export const createTeam = async (req, res) => {
  try {
    const { name, members } = req.body || {};
    const team = await Team.create({ name, members });
    return res.status(201).json(team);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating team', error: error.message });
  }
};

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find();
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
