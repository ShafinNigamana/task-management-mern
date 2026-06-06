import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeams } from '../../services/teamService';

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const teamsData = await getTeams();
        setTeams(teamsData);
      } catch (err) {
        setError('Failed to load teams.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="teams-container">
        <p className="loading-text">Loading teams...</p>
      </div>
    );
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
        <h1 className="teams-title">Teams</h1>
        <p className="teams-subtitle">Manage user groups and team collaboration</p>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="empty-card">
          <p>No teams available.</p>
        </div>
      ) : (
        <div className="teams-grid">
          {teams.map((team) => (
            <div key={team._id} className="team-card">
              <div className="team-card-content">
                <h3 className="team-card-title">{team.name}</h3>
                <div className="team-info">
                  <p className="team-info-item">
                    <span className="team-info-label">Members:</span>
                    <span className="team-info-value">{team.members.length}</span>
                  </p>
                  <p className="team-info-item">
                    <span className="team-info-label">Created:</span>
                    <span className="team-info-value">{formatDate(team.createdAt)}</span>
                  </p>
                </div>
              </div>
              <button 
                className="team-button"
                onClick={() => navigate(`/teams/${team._id}`)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamsPage;

