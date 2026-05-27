import { useEffect, useState } from 'react';
import api from './services/api';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get('/health');
        setHealth(response.data);
      } catch (error) {
        console.error('API connection failed:', error);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="app-container">
      <div className="welcome-card">
        <h1> —Hello, Users!—</h1>
        <p className="subtitle">
          Welcome to the Task Management Platform project. Let's build something awesome together!
        </p>

        <div className="status-section">
          <h2>Backend Connection</h2>
          {health ? (
            <div className="status-box success">
              <span className="status-indicator">●</span>
              API is <strong>{health.status}</strong>
              {health.db && (
                <div className="db-status">
                  <p>MongoDB: <strong>{health.db.mongo}</strong></p>
                  <p>MySQL: <strong>{health.db.mysql}</strong></p>
                </div>
              )}
            </div>
          ) : (
            <div className="status-box loading">
              <span className="status-indicator outline">○</span>
              Connecting to backend API...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;