import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeams, createTeam } from '../../services/teamService';
import { searchUsers } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { TeamsSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const teamsData = await getTeams();
        setTeams(teamsData);
      } catch {
        setError('Failed to load teams.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
    }
  };

  // Search users effect with debouncing
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

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleAddMember = (member) => {
    setSelectedMembers((prev) => [...prev, member]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMember = (memberId) => {
    setSelectedMembers((prev) => prev.filter((m) => m._id !== memberId));
  };

  function closeModal() {
    setShowModal(false);
    setNewTeamName('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMembers([]);
    setModalError(null);
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      setModalError(null);
      setLoading(true);
      await createTeam({
        name: newTeamName,
        members: selectedMembers.map((m) => m._id),
      });
      closeModal();
      
      const teamsData = await getTeams();
      setTeams(teamsData);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && teams.length === 0) {
    return <TeamsSkeleton />;
  }

  if (error) {
    return (
      <div className="teams-container">
        <div className="error-card">{error}</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="teams-container">
      {/* Header */}
      <div className="teams-header">
        <div>
          <h1 className="teams-title">Teams</h1>
          <p className="teams-subtitle">Manage user groups and team collaboration</p>
        </div>
        {user?.role === 'manager' && (
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
          >
            Create Team
          </button>
        )}
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <EmptyState 
          type="teams" 
          title="No teams yet" 
          description="You're not part of any teams yet." 
          actionLabel={user?.role === 'manager' ? "Create Team" : undefined} 
          onAction={user?.role === 'manager' ? () => setShowModal(true) : undefined} 
        />
      ) : (
        <div className="teams-grid">
          {teams.map((team) => (
            <div key={team._id} className="team-card">
              <div className="team-card-content">
                <h3 className="team-card-title">{team.name}</h3>
                <div className="team-info">
                  <p className="team-info-item">
                    <span className="team-info-label">Members:</span>
                    <span className="team-info-value">{team.members ? team.members.length : 0}</span>
                  </p>
                  <p className="team-info-item">
                    <span className="team-info-label">Created:</span>
                    <span className="team-info-value">{formatDate(team.createdAt)}</span>
                  </p>
                </div>
              </div>
              <button 
                className="btn btn-primary team-card-btn"
                onClick={() => navigate(`/teams/${team._id}`)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Team</h2>
              <button 
                type="button" 
                className="modal-close" 
                onClick={closeModal}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="form-stack">
              <div className="form-group">
                <label className="form-label" htmlFor="teamName">Team Name</label>
                <input
                  type="text"
                  id="teamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Design Team"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="memberSearch">Add Members</label>
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
                <label className="form-label">Selected Members</label>
                {selectedMembers.length === 0 ? (
                  <p className="form-help-text">No members selected yet.</p>
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

              {modalError && <div className="auth-error">{modalError}</div>}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!newTeamName.trim()}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamsPage;
