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
        <div style={{ marginBottom: '8px' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#64748b' }}>
            <strong style={{ color: '#0f172a' }}>Team ID:</strong> {teamId}
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b' }}>
            <strong style={{ color: '#0f172a' }}>Description:</strong> This page will host the Kanban board for managing team tasks in Week 4.
          </p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-content">
            <h2 className="section-title" style={{ marginBottom: '12px' }}>Planned Workflow</h2>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '0.95rem' }}>
              <li style={{ marginBottom: '8px' }}>To Do</li>
              <li style={{ marginBottom: '8px' }}>In Progress</li>
              <li>Done</li>
            </ul>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-content">
            <h2 className="section-title" style={{ marginBottom: '12px' }}>Upcoming Features</h2>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '0.95rem' }}>
              <li style={{ marginBottom: '8px' }}>Task assignment</li>
              <li style={{ marginBottom: '8px' }}>Drag and drop workflow</li>
              <li style={{ marginBottom: '8px' }}>Status updates</li>
              <li>Audit logging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamDetailPage;