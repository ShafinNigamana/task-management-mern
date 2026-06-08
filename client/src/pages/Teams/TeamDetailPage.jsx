import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function TeamDetailPage() {
  const { id: teamId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate a network request for the placeholder page
        await new Promise(resolve => setTimeout(resolve, 500));
        // To verify the error state, you could throw an error here:
        // throw new Error('Simulated error');
      } catch (err) {
        setError('Failed to load team details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teamId]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Loading team details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-card">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Team Details</h1>
        <p className="dashboard-subtitle">Team workspace and task management preparation</p>
      </div>

      <div className="dashboard-section" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">Team Details</h2>
        <div className="detail-row">
          <p className="detail-row-value">
            <strong className="detail-row-label">Team ID:</strong> {teamId}
          </p>
        </div>
        <div className="detail-row">
          <p className="detail-row-value">
            <strong className="detail-row-label">Description:</strong> This page will host the Kanban board for managing team tasks in Week 4.
          </p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-content">
            <h2 className="card-section-title">Planned Workflow</h2>
            <ul className="placeholder-list">
              <li>To Do</li>
              <li>In Progress</li>
              <li>Done</li>
            </ul>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-content">
            <h2 className="card-section-title">Upcoming Features</h2>
            <ul className="placeholder-list">
              <li>Task assignment</li>
              <li>Drag and drop workflow</li>
              <li>Status updates</li>
              <li>Audit logging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamDetailPage;