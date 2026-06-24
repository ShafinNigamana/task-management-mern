import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeams, createTeam } from '../../services/teamService';
import { searchUsers } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { TeamsSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { Users, Calendar, ArrowRight, Plus } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 leading-none">Teams</h1>
          <p className="mt-2 text-sm text-neutral-500">Manage user groups and team collaboration</p>
        </div>
        {user?.role === 'manager' && (
          <button 
            type="button" 
            className="btn btn-primary flex items-center gap-1.5" 
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} /> Create Team
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div 
              key={team._id} 
              className="group bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-neutral-300"
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-neutral-50 rounded-lg group-hover:bg-neutral-100/80 transition-colors">
                    <Users size={20} className="text-neutral-700" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 group-hover:text-black">{team.name}</h3>
                </div>
                <div className="space-y-2 text-xs text-neutral-500">
                  <div className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                    <span className="font-medium text-neutral-400">Members</span>
                    <span className="font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-full">{team.members ? team.members.length : 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="font-medium text-neutral-400">Created</span>
                    <span className="text-neutral-700 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(team.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                className="w-full btn btn-primary flex items-center justify-center gap-1.5 mt-auto group"
                onClick={() => navigate(`/teams/${team._id}`)}
              >
                View Workspace
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
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
